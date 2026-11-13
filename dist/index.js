// Safelight Print Mat Extension v1.3.0 — DISCONTINUED
// Superseded by OPGERUIMD97/safelight-mat-frame (Mat/Frame module).
// This release only shows a notice: deactivate and uninstall.
// No export processor, no Develop overlay. Templates stay in localStorage
// under safelight-print-mat-* so Mat/Frame can import them later.

export function activate(api) {
  console.log(
    "%c[safelight-print-mat] discontinued — v1.3.0 — use safelight-mat-frame",
    "color:#C15F3C;font-weight:bold"
  );
  const { react: React } = api;
  const ce = (type, props, ...ch) => React.createElement(type, props, ...ch);

  function DeprecatedPanel() {
    return ce(
      "div",
      {
        style: {
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          fontSize: 12,
          lineHeight: 1.45,
          color: "var(--color-text)",
        },
      },
      ce(
        "div",
        {
          style: {
            padding: "10px 12px",
            borderRadius: 6,
            background: "color-mix(in srgb, #C15F3C 18%, transparent)",
            border: "1px solid color-mix(in srgb, #C15F3C 45%, transparent)",
          },
        },
        ce(
          "div",
          { style: { fontWeight: 700, marginBottom: 6, fontSize: 13 } },
          "Print Mat is discontinued"
        ),
        ce(
          "div",
          null,
          "This extension no longer frames photos. Use the Mat/Frame module instead."
        )
      ),
      ce(
        "div",
        { style: { fontWeight: 600 } },
        "Please deactivate and uninstall Print Mat in View → Extensions."
      ),
      ce(
        "div",
        { style: { color: "var(--color-text-muted)" } },
        "Install the replacement: OPGERUIMD97/safelight-mat-frame"
      ),
      ce(
        "div",
        { style: { color: "var(--color-text-muted)", fontSize: 11 } },
        "Your saved templates remain in browser storage (safelight-print-mat-*) so Mat/Frame can import them."
      )
    );
  }

  api.registerPanel({
    id: "safelight-print-mat.panel",
    title: "Print Mat",
    component: DeprecatedPanel,
    defaultLocation: "right",
  });
}

export function deactivate() {}
