/**
 * KaTeX Inline Math Fix for Zotero
 *
 * Hooks Zotero.Notes.registerEditorInstance to intercept editor creation,
 * injects a script that replaces \( \) with $ and \[ \] with $$ on paste.
 */

const EDITOR_SCRIPT = String.raw`
(function() {
  if (window.__zoteroLatexFixInstalled) return;
  window.__zoteroLatexFixInstalled = true;

  function replaceLatex(text) {
    text = text.replace(/\\\((.+?)\\\)/g, '$$$1$$');
    text = text.replace(/\\\[(.+?)\\\]/g, '$$$$$1$$$$');
    text = text.replace(/\\\{/g, '{');
    text = text.replace(/\\\}/g, '}');
    text = text.replace(/\\\(/g, '$');
    text = text.replace(/\\\)/g, '$');
    text = text.replace(/\\\[/g, '$$');
    text = text.replace(/\\\]/g, '$$');
    return text;
  }

  // Find $...$ and $$...$$ patterns and convert to math nodes
  function convertDollarMath(state) {
    var mathInline = state.schema.nodes.math_inline;
    var mathDisplay = state.schema.nodes.math_display;
    if (!mathInline && !mathDisplay) return null;
    var matches = [];
    state.doc.descendants(function(node, pos) {
      if (!node.isText || !node.text) return;
      var text = node.text;
      var i = 0;
      while (i < text.length) {
        if (text[i] !== '$') { i++; continue; }
        // Check for $$ first (display math)
        if (i + 1 < text.length && text[i + 1] === '$') {
          var close = text.indexOf('$$', i + 2);
          if (close !== -1) {
            var latex = text.substring(i + 2, close);
            if (latex.trim().length > 0) {
              matches.push({ from: pos + i, to: pos + close + 2, latex: latex, type: 'display' });
              i = close + 2;
              continue;
            }
          }
        }
        // Single $ (inline math)
        var closeInline = text.indexOf('$', i + 1);
        if (closeInline !== -1) {
          var latexInline = text.substring(i + 1, closeInline);
          if (latexInline.trim().length > 0) {
            matches.push({ from: pos + i, to: pos + closeInline + 1, latex: latexInline, type: 'inline' });
            i = closeInline + 1;
            continue;
          }
        }
        i++;
      }
    });
    if (matches.length === 0) return null;
    matches.sort(function(a, b) { return b.from - a.from; });
    var tr = state.tr;
    for (var j = 0; j < matches.length; j++) {
      var match = matches[j];
      var nodeType = match.type === 'display' ? mathDisplay : mathInline;
      if (!nodeType) continue;
      try {
        var $from = tr.doc.resolve(match.from);
        if ($from.parent.canReplaceWith($from.index(), $from.index(), nodeType)) {
          var node = nodeType.create({}, state.schema.text(match.latex));
          tr.replaceWith(match.from, match.to, node);
        }
      } catch(e) {}
    }
    return tr;
  }

  function install() {
    var core = _currentEditorInstance && _currentEditorInstance._editorCore;
    if (!core || !core.view) return false;
    var view = core.view;

    // Intercept paste in capture phase, override getData to return replaced text
    document.addEventListener('paste', function(e) {
      var cd = e.clipboardData;
      if (!cd) return;
      var origGetData = cd.getData.bind(cd);
      Object.defineProperty(cd, 'getData', {
        value: function(type) {
          var text = origGetData(type);
          if (type === 'text/plain') {
            return replaceLatex(text);
          }
          return text;
        },
        configurable: true
      });
    }, true);

    // Use appendTransaction to convert ALL $...$ to math_inline nodes
    // This catches formulas that Zotero's built-in math plugin missed
    var Plugin = view.state.plugins[0].constructor;
    var plugin = new Plugin({
      appendTransaction: function(transactions, oldState, newState) {
        var hasDocChange = false;
        for (var i = 0; i < transactions.length; i++) {
          if (transactions[i].docChanged) { hasDocChange = true; break; }
        }
        if (!hasDocChange) return null;
        return convertDollarMath(newState);
      }
    });

    var newState = view.state.reconfigure({
      plugins: view.state.plugins.concat([plugin])
    });
    view.updateState(newState);

    console.log('[LaTeX Fix] Plugin installed');
    return true;
  }

  // Try immediately, then retry until editor is ready
  if (!install()) {
    var attempts = 0;
    var interval = setInterval(function() {
      attempts++;
      if (install() || attempts > 50) {
        clearInterval(interval);
      }
    }, 200);
  }
})();
`;

export class KatexFix {
  private patchedEditors: Set<string> = new Set();

  init() {
    // Hook registerEditorInstance to intercept editor creation
    const ZoteroNotes = (Zotero as any).Notes;
    if (!ZoteroNotes) return;

    const originalRegister = ZoteroNotes.registerEditorInstance;
    ZoteroNotes.registerEditorInstance = (instance: any) => {
      originalRegister.call(ZoteroNotes, instance);
      this.onEditorCreated(instance);
    };

    // Handle already-open editors
    if (ZoteroNotes._editorInstances) {
      for (const instance of ZoteroNotes._editorInstances) {
        this.onEditorCreated(instance);
      }
    }
  }

  private async onEditorCreated(instance: any) {
    try {
      // Wait for initPromise to be assigned
      await Promise.resolve();
      if (instance._initPromise) {
        await instance._initPromise;
      }

      const iframeWindow = instance._iframeWindow;
      if (!iframeWindow) return;

      // Skip if already patched
      const id = instance.instanceID || String(Math.random());
      if (this.patchedEditors.has(id)) return;
      this.patchedEditors.add(id);

      // Inject script into the iframe
      const doc = iframeWindow.document;
      const script = doc.createElement("script");
      script.textContent = EDITOR_SCRIPT;
      const target = doc.head || doc.body || doc.documentElement;
      if (target) {
        target.appendChild(script);
        iframeWindow.setTimeout(() => script.remove(), 0);
      }
    } catch (e) {
      // Editor not ready yet, ignore
    }
  }

  destroy() {
    this.patchedEditors.clear();
  }
}
