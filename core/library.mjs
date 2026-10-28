/** Project-agnostic component anatomy and semantic defaults. Visual themes own appearance. */
export const LIBRARY_VERSION='2.8.0';
export { LAYOUT_PROFILES } from './layout.mjs';
function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
export const APPEARANCE_PROPERTIES=freeze([
  "color",
  "backgroundColor",
  "background",
  "border",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderWidth",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "outline",
  "outlineColor",
  "outlineWidth",
  "outlineStyle",
  "outlineOffset",
  "boxShadow",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textTransform",
  "textDecoration",
  "accentColor",
  "fill",
  "stroke",
  "strokeWidth",
  "opacity",
  "transition",
  "transitionDuration",
  "transitionDelay",
  "transitionTimingFunction"
]);
export const POSITIVE_SPACING_TOKENS=freeze([
  "space.component.padding",
  "space.component.paddingLarge",
  "space.component.paddingCompact",
  "space.component.gap",
  "space.component.gapLarge"
]);
export const COMPONENT_ALIASES=freeze({
  "tool-button": "action-button",
  "simulation-caption": "caption",
  "brandSelect": "choice-field",
  "stat-row": "metric-row"
});
export const VARIANT_ALIASES=freeze({
  "button": {
    "library": "list-item",
    "tour": "rounded",
    "close": "dismiss",
    "close-panel": "dismiss-small",
    "close-room": "dismiss-compact",
    "list-action": "danger-subtle"
  },
  "select": {
    "room": "compact"
  },
  "segmented-option": {
    "room": "dense",
    "season": "compact"
  },
  "heading": {
    "narrative": "expressive",
    "narrative-large": "expressive-large"
  },
  "card": {
    "hairline": "subtle-border",
    "sunk": "subtle",
    "lifted": "floating"
  },
  "metric-row": {
    "preset": "compact"
  },
  "tooltip": {
    "limit": "warning"
  },
  "action-button": {
    "icon": "horizontal"
  },
  "choice-field": {
    "open": "default"
  }
});
export const STATE_ALIASES=freeze({
  "button": {
    "selected": "pressed"
  },
  "action-button": {
    "selected": "pressed"
  },
  "segmented-option": {
    "selected": "pressed"
  }
});
export const PART_ALIASES=freeze({
  "caption": {
    "clock": "label"
  }
});
export const TOKEN_ALIASES=freeze({
  "typography.font.narrative": "typography.font.expressive",
  "typography.weight.narrative": "typography.weight.expressive",
  "typography.size.narrative": "typography.size.captionText",
  "typography.lineHeight.narrative": "typography.lineHeight.captionText",
  "typography.size.libraryHeading": "typography.size.expressive",
  "typography.size.libraryDetail": "typography.size.expressiveLarge",
  "typography.tracking.clock": "typography.tracking.captionLabel",
  "color.narrative.text": "color.caption.text",
  "color.narrative.clock": "color.caption.labelSurface",
  "color.narrative.surface": "color.caption.surface",
  "size.tool.width": "size.actionButton.width",
  "size.icon.tool": "size.icon.action",
  "size.icon.panel": "size.icon.compact",
  "radius.tool": "radius.actionButton"
});
export const LEGACY_SELECTORS=freeze({
  ".ds-choice-field": [
    ".ds-brand-select"
  ],
  ".ds-choice-field__list": [
    ".ds-brand-select__list"
  ],
  ".ds-choice-field__option": [
    ".ds-brand-select__option"
  ],
  ".ds-choice-field__control": [
    ".ds-brand-select__trigger"
  ],
  ".ds-action-button": [
    ".ds-tool-button"
  ],
  ".ds-action-button__icon": [
    ".ds-tool-button__icon"
  ],
  ".ds-action-button__shortcut": [
    ".ds-tool-button__shortcut"
  ],
  ".ds-metric-row": [
    ".ds-stat-row"
  ],
  ".ds-metric-row__label": [
    ".ds-stat-row__label"
  ],
  ".ds-metric-row__value": [
    ".ds-stat-row__value"
  ],
  ".ds-caption": [
    ".ds-simulation-caption"
  ],
  ".ds-caption__label": [
    ".ds-simulation-caption__clock"
  ],
  ".ds-caption__text": [
    ".ds-simulation-caption__text"
  ]
});
export const DEFAULT_TOKENS=freeze({
  "color.background.canvas": {
    "$type": "color",
    "$value": "#f5f6f8",
    "description": "Central default: Produktets grundbaggrund."
  },
  "color.background.surface": {
    "$type": "color",
    "$value": "#ffffff",
    "description": "Central default: Baggrund for kort, dialoger og indtastningsfelter."
  },
  "color.background.subtle": {
    "$type": "color",
    "$value": "#eef0f4",
    "description": "Central default: Svagt fremhævede områder og neutrale badges."
  },
  "color.text.primary": {
    "$type": "color",
    "$value": "#202632",
    "description": "Central default: Primær tekst og overskrifter."
  },
  "color.text.secondary": {
    "$type": "color",
    "$value": "#596273",
    "description": "Central default: Supplerende tekst og vejledning."
  },
  "color.border.default": {
    "$type": "color",
    "$value": "#d9dde5",
    "description": "Central default: Standardkant på kontroller og overflader."
  },
  "color.action.primary": {
    "$type": "color",
    "$value": "#4355c5",
    "description": "Central default: Primære handlinger og valgte kontroller."
  },
  "color.action.primaryText": {
    "$type": "color",
    "$value": "#ffffff",
    "description": "Central default: Tekst oven på den primære handlingsfarve."
  },
  "color.action.subtle": {
    "$type": "color",
    "$value": "#edf0ff",
    "description": "Central default: Svag baggrund for sekundære handlinger og accentbadges."
  },
  "color.action.subtleText": {
    "$type": "color",
    "$value": "#3646a5",
    "description": "Central default: Tekst på den svage handlingsbaggrund."
  },
  "color.focus": {
    "$type": "color",
    "$value": "{color.action.primary}",
    "description": "Central default: Synlig markering af tastaturfokus."
  },
  "color.status.danger": {
    "$type": "color",
    "$value": "#b92338",
    "description": "Central default: Fejlkant og destruktive handlinger."
  },
  "color.status.dangerSurface": {
    "$type": "color",
    "$value": "#fff0f2",
    "description": "Central default: Baggrund for fejlbeskeder."
  },
  "color.status.dangerText": {
    "$type": "color",
    "$value": "#971b2d",
    "description": "Central default: Tekst på fejlbaggrunden og selvstændig fejltekst."
  },
  "color.status.dangerContrast": {
    "$type": "color",
    "$value": "#ffffff",
    "description": "Central default: Tekst på en destruktiv handlingsknap."
  },
  "color.disabled.surface": {
    "$type": "color",
    "$value": "#e8edf4",
    "description": "Central default: Baggrund for deaktiverede inputkontroller."
  },
  "color.disabled.text": {
    "$type": "color",
    "$value": "#6d7890",
    "description": "Central default: Tekst i deaktiverede inputkontroller."
  },
  "typography.font.body": {
    "$type": "fontFamily",
    "$value": "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
    "description": "Central default: Brødtekst og kontroller; ingen ekstern skrifttjeneste er nødvendig."
  },
  "typography.font.heading": {
    "$type": "fontFamily",
    "$value": "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
    "description": "Central default: Overskrifter og titler."
  },
  "typography.size.body": {
    "$type": "dimension",
    "$value": "1rem",
    "description": "Central default: Normal læsetekst."
  },
  "typography.size.heading": {
    "$type": "dimension",
    "$value": "2rem",
    "description": "Central default: Primær overskrift i designeksemplerne."
  },
  "typography.size.label": {
    "$type": "dimension",
    "$value": "0.875rem",
    "description": "Central default: Labels og betjeningskontroller."
  },
  "typography.size.small": {
    "$type": "dimension",
    "$value": "0.8125rem",
    "description": "Central default: Hjælpetekst og kompakte badges."
  },
  "typography.size.title": {
    "$type": "dimension",
    "$value": "1.25rem",
    "description": "Central default: Titler i kort og dialoger."
  },
  "typography.weight.body": {
    "$type": "fontWeight",
    "$value": 400,
    "description": "Central default: Normal tekstvægt."
  },
  "typography.weight.heading": {
    "$type": "fontWeight",
    "$value": 650,
    "description": "Central default: Overskrifternes tekstvægt."
  },
  "typography.weight.label": {
    "$type": "fontWeight",
    "$value": 600,
    "description": "Central default: Labels og handlingsknappers tekstvægt."
  },
  "typography.lineHeight.body": {
    "$type": "number",
    "$value": 1.55,
    "description": "Central default: Linjehøjde uden enhed for brødtekst."
  },
  "typography.lineHeight.heading": {
    "$type": "number",
    "$value": 1.2,
    "description": "Central default: Linjehøjde uden enhed for overskrifter."
  },
  "typography.lineHeight.control": {
    "$type": "number",
    "$value": 1.3,
    "description": "Central default: Linjehøjde uden enhed for knapper og badges."
  },
  "space.1": {
    "$type": "dimension",
    "$value": "0.25rem",
    "description": "Central default: Små indvendige mellemrum."
  },
  "space.2": {
    "$type": "dimension",
    "$value": "0.5rem",
    "description": "Central default: Tæt afstand mellem beslægtede elementer."
  },
  "space.3": {
    "$type": "dimension",
    "$value": "0.75rem",
    "description": "Central default: Kompakt indvendig afstand."
  },
  "space.4": {
    "$type": "dimension",
    "$value": "1rem",
    "description": "Central default: Standardafstand og vandret kontrolpadding."
  },
  "space.6": {
    "$type": "dimension",
    "$value": "1.5rem",
    "description": "Central default: Indvendig afstand i større overflader."
  },
  "space.8": {
    "$type": "dimension",
    "$value": "2rem",
    "description": "Central default: Afstand mellem visuelle grupper."
  },
  "size.control.height": {
    "$type": "dimension",
    "$value": "2.75rem",
    "description": "Central default: Minimumshøjde for knapper, input og select."
  },
  "size.checkbox": {
    "$type": "dimension",
    "$value": "1.125rem",
    "description": "Central default: Checkboxens visuelle størrelse."
  },
  "size.dialog.maxWidth": {
    "$type": "dimension",
    "$value": "36rem",
    "description": "Central default: Dialogfladens maksimale bredde."
  },
  "border.width.default": {
    "$type": "dimension",
    "$value": "1px",
    "description": "Central default: Standardbredde på kanter."
  },
  "border.width.focus": {
    "$type": "dimension",
    "$value": "3px",
    "description": "Central default: Bredde på den synlige fokusmarkering."
  },
  "border.offset.focus": {
    "$type": "dimension",
    "$value": "3px",
    "description": "Central default: Afstand fra kontrol til fokusmarkering."
  },
  "radius.control": {
    "$type": "dimension",
    "$value": "0.5rem",
    "description": "Central default: Hjørner på knapper og input."
  },
  "radius.card": {
    "$type": "dimension",
    "$value": "1rem",
    "description": "Central default: Hjørner på kort, beskeder og dialoger."
  },
  "radius.badge": {
    "$type": "dimension",
    "$value": "999px",
    "description": "Central default: Afrunding på badges."
  },
  "opacity.hover": {
    "$type": "number",
    "$value": 0.94,
    "description": "Central default: Knapopacitet ved hover."
  },
  "opacity.active": {
    "$type": "number",
    "$value": 0.9,
    "description": "Central default: Knapopacitet under aktivering."
  },
  "opacity.disabled": {
    "$type": "number",
    "$value": 0.45,
    "description": "Central default: Opacitet for deaktiverede knapper og checkboxes."
  },
  "shadow.card": {
    "$type": "shadow",
    "$value": "0 1px 3px rgba(20, 28, 44, 0.04), 0 8px 24px rgba(20, 28, 44, 0.03)",
    "description": "Central default: Skygge på hævede overflader."
  },
  "duration.fast": {
    "$type": "duration",
    "$value": "140ms",
    "description": "Central default: Varighed af små visuelle tilstandsskift."
  },
  "color.background.inverse": {
    "$type": "color",
    "$value": "{color.text.primary}",
    "description": "Central semantic default: inherits color.text.primary so components follow the selected theme. A theme may provide its own documented value."
  },
  "color.text.muted": {
    "$type": "color",
    "$value": "{color.text.secondary}",
    "description": "Central semantic default: inherits color.text.secondary so components follow the selected theme. A theme may provide its own documented value."
  },
  "color.text.label": {
    "$type": "color",
    "$value": "{color.text.secondary}",
    "description": "Central semantic default: inherits color.text.secondary so components follow the selected theme. A theme may provide its own documented value."
  },
  "color.text.inverse": {
    "$type": "color",
    "$value": "{color.background.surface}",
    "description": "Central semantic default: inherits color.background.surface so components follow the selected theme. A theme may provide its own documented value."
  },
  "color.border.strong": {
    "$type": "color",
    "$value": "{color.text.secondary}",
    "description": "Central semantic default: inherits color.text.secondary so components follow the selected theme. A theme may provide its own documented value."
  },
  "color.brand.accent": {
    "$type": "color",
    "$value": "{color.action.primary}",
    "description": "Central semantic default: inherits color.action.primary so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.size.caption": {
    "$type": "dimension",
    "$value": "{typography.size.small}",
    "description": "Central semantic default: inherits typography.size.small so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.size.toolLabel": {
    "$type": "dimension",
    "$value": "13px",
    "description": "Compact tool labels beneath an icon; the shared tool variant keeps a 52 px minimum target."
  },
  "typography.size.control": {
    "$type": "dimension",
    "$value": "{typography.size.label}",
    "description": "Central semantic default: inherits typography.size.label so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.size.display": {
    "$type": "dimension",
    "$value": "3.5rem",
    "description": "Central default: Stor overskrift; skaleres responsivt i display-varianten."
  },
  "typography.size.tag": {
    "$type": "dimension",
    "$value": "{typography.size.label}",
    "description": "Central semantic default: inherits typography.size.label so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.weight.display": {
    "$type": "fontWeight",
    "$value": "{typography.weight.heading}",
    "description": "Central semantic default: inherits typography.weight.heading so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.lineHeight.subtitle": {
    "$type": "number",
    "$value": "{typography.lineHeight.heading}",
    "description": "Central semantic default: inherits typography.lineHeight.heading so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.lineHeight.display": {
    "$type": "number",
    "$value": "{typography.lineHeight.heading}",
    "description": "Central semantic default: inherits typography.lineHeight.heading so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.lineHeight.label": {
    "$type": "number",
    "$value": "{typography.lineHeight.body}",
    "description": "Central semantic default: inherits typography.lineHeight.body so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.tracking.label": {
    "$type": "dimension",
    "$value": "0.08em",
    "description": "Central default: Diskret bogstavafstand i korte kategorietiketter."
  },
  "typography.tracking.display": {
    "$type": "dimension",
    "$value": "-0.02em",
    "description": "Central default: Bogstavafstand for rollen display; negativ tracking er til større seriftekst."
  },
  "typography.measure.body": {
    "$type": "dimension",
    "$value": "62ch",
    "description": "Central default: Anbefalet maksimal målebredde til læsetekst; projektet vælger layout."
  },
  "size.checkbox.indicator": {
    "$type": "dimension",
    "$value": "8px",
    "description": "Central default: Fælles mål for checkbox.indicator fra Fjordsides kontrolgeometri."
  },
  "size.switch.width": {
    "$type": "dimension",
    "$value": "44px",
    "description": "Central default: Kontaktens visuelle bredde; label bevarer den store klikflade."
  },
  "size.switch.height": {
    "$type": "dimension",
    "$value": "24px",
    "description": "Central default: Kontaktens visuelle højde."
  },
  "size.switch.thumb": {
    "$type": "dimension",
    "$value": "18px",
    "description": "Central default: Kontaktens runde markør."
  },
  "size.switch.inset": {
    "$type": "dimension",
    "$value": "2px",
    "description": "Central default: Fælles mål for switch.inset fra Fjordsides kontrolgeometri."
  },
  "size.switch.checkedOffset": {
    "$type": "dimension",
    "$value": "22px",
    "description": "Central default: Ældre adapteres offset; biblioteket beregner position fra bredde, markør og inset."
  },
  "size.notice.marker": {
    "$type": "dimension",
    "$value": "10px",
    "description": "Central default: Fælles mål for notice.marker fra Fjordsides kontrolgeometri."
  },
  "radius.radio": {
    "$type": "dimension",
    "$value": "50%",
    "description": "Central default: Den funktionelle cirkel i et radiovalg."
  },
  "shadow.floating": {
    "$type": "shadow",
    "$value": "0 12px 40px rgba(20, 28, 44, 0.14)",
    "description": "Central default: Dybde til dialoger og flader over indholdet."
  },
  "duration.base": {
    "$type": "duration",
    "$value": "180ms",
    "description": "Central default: Rolige farve- og kantændringer."
  },
  "color.background.control": {
    "$type": "color",
    "$value": "{color.background.surface}",
    "description": "Central semantic default: inherits color.background.surface so components follow the selected theme. A theme may provide its own documented value."
  },
  "color.narrative.text": {
    "$type": "color",
    "$value": "{color.caption.text}",
    "description": "Compatibility alias for color.caption.text. Use the canonical token in new integrations."
  },
  "color.narrative.clock": {
    "$type": "color",
    "$value": "{color.caption.labelSurface}",
    "description": "Compatibility alias for color.caption.labelSurface. Use the canonical token in new integrations."
  },
  "typography.font.narrative": {
    "$type": "fontFamily",
    "$value": "{typography.font.expressive}",
    "description": "Compatibility alias for typography.font.expressive. Use the canonical token in new integrations."
  },
  "typography.size.tiny": {
    "$type": "dimension",
    "$value": "{typography.size.small}",
    "description": "Central semantic default: inherits typography.size.small so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.size.shortcut": {
    "$type": "dimension",
    "$value": "{typography.size.small}",
    "description": "Central semantic default: inherits typography.size.small so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.size.close": {
    "$type": "dimension",
    "$value": "{typography.size.title}",
    "description": "Central semantic default: inherits typography.size.title so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.size.libraryHeading": {
    "$type": "dimension",
    "$value": "{typography.size.expressive}",
    "description": "Compatibility alias for typography.size.expressive. Use the canonical token in new integrations."
  },
  "typography.size.libraryDetail": {
    "$type": "dimension",
    "$value": "{typography.size.expressiveLarge}",
    "description": "Compatibility alias for typography.size.expressiveLarge. Use the canonical token in new integrations."
  },
  "typography.size.narrative": {
    "$type": "dimension",
    "$value": "{typography.size.captionText}",
    "description": "Compatibility alias for typography.size.captionText. Use the canonical token in new integrations."
  },
  "typography.weight.strong": {
    "$type": "fontWeight",
    "$value": "{typography.weight.heading}",
    "description": "Central semantic default: inherits typography.weight.heading so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.weight.narrative": {
    "$type": "fontWeight",
    "$value": "{typography.weight.expressive}",
    "description": "Compatibility alias for typography.weight.expressive. Use the canonical token in new integrations."
  },
  "typography.lineHeight.note": {
    "$type": "number",
    "$value": "{typography.lineHeight.body}",
    "description": "Central semantic default: inherits typography.lineHeight.body so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.lineHeight.tiny": {
    "$type": "number",
    "$value": "{typography.lineHeight.body}",
    "description": "Central semantic default: inherits typography.lineHeight.body so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.lineHeight.narrative": {
    "$type": "number",
    "$value": "{typography.lineHeight.captionText}",
    "description": "Compatibility alias for typography.lineHeight.captionText. Use the canonical token in new integrations."
  },
  "typography.tracking.section": {
    "$type": "dimension",
    "$value": "0.8px",
    "description": "Central default: Eksisterende bogstavafstand for section."
  },
  "typography.tracking.brand": {
    "$type": "dimension",
    "$value": "0.3px",
    "description": "Central default: Eksisterende bogstavafstand for brand."
  },
  "typography.tracking.clock": {
    "$type": "dimension",
    "$value": "{typography.tracking.captionLabel}",
    "description": "Compatibility alias for typography.tracking.captionLabel. Use the canonical token in new integrations."
  },
  "radius.segment": {
    "$type": "dimension",
    "$value": "{radius.control}",
    "description": "Central semantic default: inherits radius.control so components follow the selected theme. A theme may provide its own documented value."
  },
  "radius.tool": {
    "$type": "dimension",
    "$value": "{radius.actionButton}",
    "description": "Compatibility alias for radius.actionButton. Use the canonical token in new integrations."
  },
  "radius.note": {
    "$type": "dimension",
    "$value": "{radius.control}",
    "description": "Central semantic default: inherits radius.control so components follow the selected theme. A theme may provide its own documented value."
  },
  "radius.pill": {
    "$type": "dimension",
    "$value": "{radius.badge}",
    "description": "Central semantic default: inherits radius.badge so components follow the selected theme. A theme may provide its own documented value."
  },
  "space.px4": {
    "$type": "dimension",
    "$value": "4px",
    "description": "Central default: Bevaret kompakt editorafstand."
  },
  "shadow.selected": {
    "$type": "shadow",
    "$value": "0 1px 3px rgba(20, 28, 44, 0.12)",
    "description": "Central default: Lille skygge under det valgte segment."
  },
  "opacity.shortcut": {
    "$type": "number",
    "$value": 1,
    "description": "Central default: Eksisterende visuel tilstand shortcut."
  },
  "size.icon.brand": {
    "$type": "dimension",
    "$value": "22px",
    "description": "Central default: Eksisterende reference for icon.brand; produktet ejer layout."
  },
  "size.icon.action": {
    "$type": "dimension",
    "$value": "22px",
    "description": "Central default: Ikon i en handlingsknap."
  },
  "size.icon.panel": {
    "$type": "dimension",
    "$value": "{size.icon.compact}",
    "description": "Compatibility alias for size.icon.compact. Use the canonical token in new integrations."
  },
  "size.icon.tool": {
    "$type": "dimension",
    "$value": "{size.icon.action}",
    "description": "Compatibility alias for size.icon.action. Use the canonical token in new integrations."
  },
  "size.tool.width": {
    "$type": "dimension",
    "$value": "{size.actionButton.width}",
    "description": "Compatibility alias for size.actionButton.width. Use the canonical token in new integrations."
  },
  "color.background.detail": {
    "$type": "color",
    "$value": "{color.background.surface}",
    "description": "Central semantic default: inherits color.background.surface so components follow the selected theme. A theme may provide its own documented value."
  },
  "color.narrative.surface": {
    "$type": "color",
    "$value": "{color.caption.surface}",
    "description": "Compatibility alias for color.caption.surface. Use the canonical token in new integrations."
  },
  "typography.size.clock": {
    "$type": "dimension",
    "$value": "{typography.size.label}",
    "description": "Central semantic default: inherits typography.size.label so components follow the selected theme. A theme may provide its own documented value."
  },
  "typography.size.panel": {
    "$type": "dimension",
    "$value": "{typography.size.title}",
    "description": "Central semantic default: inherits typography.size.title so components follow the selected theme. A theme may provide its own documented value."
  },
  "space.component.padding": {
    "$type": "dimension",
    "$value": "{space.4}",
    "description": "Required positive inset for shared surfaces."
  },
  "space.component.paddingLarge": {
    "$type": "dimension",
    "$value": "{space.6}",
    "description": "Required positive inset for cards and dialogs."
  },
  "space.component.paddingCompact": {
    "$type": "dimension",
    "$value": "{space.2}",
    "description": "Required positive inset for compact controls."
  },
  "space.component.gap": {
    "$type": "dimension",
    "$value": "{space.2}",
    "description": "Required positive separation within shared components."
  },
  "space.component.gapLarge": {
    "$type": "dimension",
    "$value": "{space.4}",
    "description": "Required positive separation within shared surfaces."
  },
  "size.brand.logo": {
    "$type": "dimension",
    "$value": "12rem",
    "description": "Central default: maximum size of an approved original logo; proportions are preserved."
  },
  "typography.font.expressive": {
    "$type": "fontFamily",
    "$value": "{typography.font.heading}",
    "description": "Central semantic default for typography.font.expressive. Themes may provide their own documented value."
  },
  "typography.weight.expressive": {
    "$type": "fontWeight",
    "$value": "{typography.weight.heading}",
    "description": "Central semantic default for typography.weight.expressive. Themes may provide their own documented value."
  },
  "typography.size.captionText": {
    "$type": "dimension",
    "$value": "1.25rem",
    "description": "Central default: Læselig billedtekst under en illustration eller indholdsvisning."
  },
  "typography.lineHeight.captionText": {
    "$type": "number",
    "$value": 1.5,
    "description": "Central default: Luft mellem billedtekstens linjer."
  },
  "typography.size.expressive": {
    "$type": "dimension",
    "$value": "2.5rem",
    "description": "Central default: Særskilt overskriftsrolle med plads til temaets typografi."
  },
  "typography.size.expressiveLarge": {
    "$type": "dimension",
    "$value": "3.5rem",
    "description": "Central default: Stor særskilt overskriftsrolle."
  },
  "typography.tracking.captionLabel": {
    "$type": "dimension",
    "$value": "1.5px",
    "description": "Central semantic default for typography.tracking.captionLabel. Themes may provide their own documented value."
  },
  "color.caption.text": {
    "$type": "color",
    "$value": "{color.text.primary}",
    "description": "Central semantic default for color.caption.text. Themes may provide their own documented value."
  },
  "color.caption.labelSurface": {
    "$type": "color",
    "$value": "{color.text.secondary}",
    "description": "Central semantic default for color.caption.labelSurface. Themes may provide their own documented value."
  },
  "color.caption.surface": {
    "$type": "color",
    "$value": "{color.background.surface}",
    "description": "Central semantic default for color.caption.surface. Themes may provide their own documented value."
  },
  "size.actionButton.width": {
    "$type": "dimension",
    "$value": "64px",
    "description": "Central semantic default for size.actionButton.width. Themes may provide their own documented value."
  },
  "size.icon.compact": {
    "$type": "dimension",
    "$value": "18px",
    "description": "Central default: Ikon i en vandret kompakt handling."
  },
  "radius.actionButton": {
    "$type": "dimension",
    "$value": "{radius.control}",
    "description": "Central semantic default for radius.actionButton. Themes may provide their own documented value."
  },
  "color.caption.labelText": {
    "$type": "color",
    "$value": "{color.action.primaryText}",
    "description": "Text on the caption label surface. Preserve readable contrast."
  },
  "color.border.field": {
    "$type": "color",
    "$value": "{color.border.default}",
    "description": "Central default: Fælles kant på indtastning og indrammede handlinger. Overfladekanter bruger color.border.default."
  },
  "color.action.neutralHover": {
    "$type": "color",
    "$value": "#e1e5ee",
    "description": "Central default: neutral Hover interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.neutralHoverText": {
    "$type": "color",
    "$value": "#202632",
    "description": "Central default: neutral HoverText interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.neutralActive": {
    "$type": "color",
    "$value": "#ccd5e3",
    "description": "Central default: neutral Active interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.neutralActiveText": {
    "$type": "color",
    "$value": "#202632",
    "description": "Central default: neutral ActiveText interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.primaryHover": {
    "$type": "color",
    "$value": "#3646a5",
    "description": "Central default: primary Hover interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.primaryHoverText": {
    "$type": "color",
    "$value": "#ffffff",
    "description": "Central default: primary HoverText interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.primaryActive": {
    "$type": "color",
    "$value": "#293987",
    "description": "Central default: primary Active interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.primaryActiveText": {
    "$type": "color",
    "$value": "#ffffff",
    "description": "Central default: primary ActiveText interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.selectedHover": {
    "$type": "color",
    "$value": "#dbe3f5",
    "description": "Central default: selected Hover interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.selectedHoverText": {
    "$type": "color",
    "$value": "#202632",
    "description": "Central default: selected HoverText interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.selectedActive": {
    "$type": "color",
    "$value": "#c7d4ef",
    "description": "Central default: selected Active interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.selectedActiveText": {
    "$type": "color",
    "$value": "#202632",
    "description": "Central default: selected ActiveText interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.dangerHover": {
    "$type": "color",
    "$value": "#9f1c2e",
    "description": "Central default: danger Hover interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.dangerHoverText": {
    "$type": "color",
    "$value": "#ffffff",
    "description": "Central default: danger HoverText interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.dangerActive": {
    "$type": "color",
    "$value": "#841326",
    "description": "Central default: danger Active interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.dangerActiveText": {
    "$type": "color",
    "$value": "#ffffff",
    "description": "Central default: danger ActiveText interaction role; themes specify a matching, contrasting colour pair."
  },
  "color.action.accentHover": {
    "$type": "color",
    "$value": "{color.action.primaryHover}",
    "description": "Central default: Accent interaction follows primary unless the theme defines its own accent family."
  },
  "color.action.accentHoverText": {
    "$type": "color",
    "$value": "{color.action.primaryHoverText}",
    "description": "Central default: Accent interaction follows primary unless the theme defines its own accent family."
  },
  "color.action.accentActive": {
    "$type": "color",
    "$value": "{color.action.primaryActive}",
    "description": "Central default: Accent interaction follows primary unless the theme defines its own accent family."
  },
  "color.action.accentActiveText": {
    "$type": "color",
    "$value": "{color.action.primaryActiveText}",
    "description": "Central default: Accent interaction follows primary unless the theme defines its own accent family."
  }
});
export const COMPONENT_LIBRARY=freeze({
  "text": {
    "name": "Tekst",
    "description": "Læsetekst og supplerende information.",
    "usage": "Brug p eller span efter indholdets semantik. Produktet ejer indhold og læserækkefølge.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-text",
        "styles": {
          "margin": "0",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.body}",
          "fontWeight": "{typography.weight.body}",
          "lineHeight": "{typography.lineHeight.body}",
          "color": "{color.text.primary}"
        }
      }
    },
    "variants": {
      "secondary": {
        "description": "Supplerende handling.",
        "styles": {
          "color": "{color.text.secondary}"
        }
      },
      "small": {
        "description": "Kompakt hjælpetekst.",
        "styles": {
          "fontSize": "{typography.size.small}",
          "color": "{color.text.secondary}"
        }
      },
      "editorial": {
        "description": "Særskilt rolle til læsetekst.",
        "styles": {
          "fontFamily": "{typography.font.heading}",
          "maxWidth": "{typography.measure.body}"
        }
      },
      "caption": {
        "description": "Supplerende beskrivelse.",
        "styles": {
          "fontSize": "{typography.size.caption}",
          "color": "{color.text.muted}"
        }
      },
      "tiny": {
        "description": "Meget kompakt hjælpetekst.",
        "styles": {
          "fontSize": "{typography.size.tiny}",
          "lineHeight": "{typography.lineHeight.tiny}",
          "color": "{color.text.secondary}"
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "p",
      "part": "root",
      "text": "En kort og tydelig beskrivelse."
    }
  },
  "button": {
    "name": "Knap",
    "description": "En navngivet handling med tydeligt hierarki.",
    "usage": "Brug native button til handlinger. Primær fremhævning angiver den vigtigste lokale handling; utilgængelige handlinger bruger disabled.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-button",
        "styles": {
          "display": "inline-flex",
          "alignItems": "center",
          "justifyContent": "center",
          "gap": "{space.component.gap}",
          "minHeight": "max(44px, {size.control.height})",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "border": "{border.width.default} solid transparent",
          "borderRadius": "{radius.control}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.label}",
          "fontWeight": "{typography.weight.label}",
          "lineHeight": "{typography.lineHeight.control}",
          "backgroundColor": "{color.action.primary}",
          "color": "{color.action.primaryText}",
          "cursor": "pointer",
          "transition": "background-color {duration.fast}, color {duration.fast}, border-color {duration.fast}, opacity {duration.fast}, box-shadow {duration.fast}",
          "minWidth": "44px",
          "boxSizing": "border-box",
          "textDecoration": "none",
          "maxWidth": "100%",
          "whiteSpace": "normal",
          "overflowWrap": "normal",
          "--ds-interaction-hover-surface": "{color.action.primaryHover}",
          "--ds-interaction-hover-text": "{color.action.primaryHoverText}",
          "--ds-interaction-active-surface": "{color.action.primaryActive}",
          "--ds-interaction-active-text": "{color.action.primaryActiveText}",
          "wordBreak": "normal",
          "flexShrink": "0"
        }
      },
      "heading": {
        "selector": ".ds-button__heading",
        "styles": {
          "display": "block",
          "minWidth": "0",
          "fontWeight": "inherit",
          "color": "inherit",
          "whiteSpace": "normal",
          "overflowWrap": "normal",
          "wordBreak": "normal"
        }
      },
      "description": {
        "selector": ".ds-button__description",
        "styles": {
          "display": "none",
          "margin": "{space.1} 0 0",
          "fontSize": "{typography.size.small}",
          "fontWeight": "{typography.weight.body}",
          "lineHeight": "{typography.lineHeight.body}",
          "color": "{color.text.secondary}",
          "whiteSpace": "normal",
          "overflowWrap": "normal",
          "wordBreak": "normal"
        }
      }
    },
    "variants": {
      "desktop": {
  "description": "Kompakt desktopbetjening med 32 px klikflader. Brug standardvarianten ved touch eller behov for større mål.",
  "styles": {
    "minHeight": "32px",
    "minWidth": "32px",
    "padding": "{space.component.paddingCompact} {space.component.padding}",
    "backgroundColor": "{color.background.control}",
    "color": "{color.text.primary}",
    "borderColor": "{color.border.field}",
    "--ds-interaction-hover-surface": "{color.action.neutralHover}",
    "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
    "--ds-interaction-active-surface": "{color.action.neutralActive}",
    "--ds-interaction-active-text": "{color.action.neutralActiveText}"
  }
},
      "primary": {
        "description": "Vigtigste lokale handling.",
        "styles": {
          "backgroundColor": "{color.action.primary}",
          "color": "{color.action.primaryText}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "--ds-interaction-hover-surface": "{color.action.primaryHover}",
          "--ds-interaction-hover-text": "{color.action.primaryHoverText}",
          "--ds-interaction-active-surface": "{color.action.primaryActive}",
          "--ds-interaction-active-text": "{color.action.primaryActiveText}"
        }
      },
      "secondary": {
        "description": "Supplerende handling.",
        "styles": {
          "backgroundColor": "{color.background.control}",
          "color": "{color.text.primary}",
          "borderColor": "{color.border.field}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      },
      "ghost": {
        "description": "Lav visuel fremhævning.",
        "styles": {
          "backgroundColor": "transparent",
          "color": "{color.action.subtleText}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      },
      "danger": {
        "description": "Destruktiv handling eller fejlstatus.",
        "styles": {
          "backgroundColor": "{color.status.danger}",
          "color": "{color.status.dangerContrast}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "--ds-interaction-hover-surface": "{color.action.dangerHover}",
          "--ds-interaction-hover-text": "{color.action.dangerHoverText}",
          "--ds-interaction-active-surface": "{color.action.dangerActive}",
          "--ds-interaction-active-text": "{color.action.dangerActiveText}"
        }
      },
      "accent": {
        "description": "Særskilt fremhævning.",
        "styles": {
          "backgroundColor": "{color.brand.accent}",
          "color": "{color.background.canvas}",
          "borderColor": "{color.brand.accent}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "--ds-interaction-hover-surface": "{color.action.accentHover}",
          "--ds-interaction-hover-text": "{color.action.accentHoverText}",
          "--ds-interaction-active-surface": "{color.action.accentActive}",
          "--ds-interaction-active-text": "{color.action.accentActiveText}"
        }
      },
      "toolbar": {
        "description": "Kompakt handling i en gruppe.",
        "styles": {
          "border": "0",
          "backgroundColor": "transparent",
          "padding": "{space.component.paddingCompact}",
          "color": "{color.text.primary}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      },
      "icon": {
        "description": "Handling med ikon.",
        "styles": {
          "border": "0",
          "backgroundColor": "transparent",
          "padding": "{space.component.paddingCompact}",
          "display": "flex",
          "alignItems": "center",
          "color": "{color.text.primary}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      },
      "menu": {
        "description": "Handling i en menuliste.",
        "styles": {
          "display": "block",
          "width": "100%",
          "textAlign": "left",
          "border": "0",
          "backgroundColor": "transparent",
          "padding": "{space.component.paddingCompact}",
          "color": "{color.text.primary}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        },
        "parts": {
          "description": {
            "styles": {
              "display": "block"
            }
          }
        }
      },
      "dismiss": {
        "description": "Lukke- eller afvisningshandling.",
        "styles": {
          "border": "0",
          "backgroundColor": "transparent",
          "padding": "{space.component.paddingCompact}",
          "fontSize": "{typography.size.close}",
          "lineHeight": 1,
          "color": "{color.text.secondary}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      },
      "list-item": {
        "description": "Handling knyttet til en listepost.",
        "styles": {
          "display": "block",
          "width": "100%",
          "textAlign": "left",
          "border": "0",
          "borderBottom": "{border.width.default} solid {color.border.default}",
          "backgroundColor": "transparent",
          "padding": "{space.component.paddingCompact}",
          "color": "{color.text.primary}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        },
        "parts": {
          "description": {
            "styles": {
              "display": "block"
            }
          }
        }
      },
      "link": {
        "description": "Typografisk fremhævet handling.",
        "styles": {
          "border": "0",
          "backgroundColor": "transparent",
          "padding": "{space.component.paddingCompact}",
          "fontWeight": "{typography.weight.strong}",
          "color": "{color.action.subtleText}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      },
      "danger-subtle": {
        "description": "Destruktiv handling med lav fremhævning.",
        "styles": {
          "border": "0",
          "backgroundColor": "transparent",
          "color": "{color.status.danger}",
          "fontWeight": "{typography.weight.strong}",
          "padding": "{space.component.paddingCompact}",
          "--ds-interaction-hover-surface": "{color.action.dangerHover}",
          "--ds-interaction-hover-text": "{color.action.dangerHoverText}",
          "--ds-interaction-active-surface": "{color.action.dangerActive}",
          "--ds-interaction-active-text": "{color.action.dangerActiveText}"
        }
      },
      "rounded": {
        "description": "Afrundet handling.",
        "styles": {
          "border": "{border.width.default} solid {color.border.field}",
          "backgroundColor": "{color.caption.surface}",
          "borderRadius": "{radius.pill}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "color": "{color.text.primary}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      },
      "dismiss-small": {
        "description": "Lille lukkehandling.",
        "styles": {
          "border": "0",
          "backgroundColor": "transparent",
          "padding": "{space.component.paddingCompact}",
          "fontSize": "{typography.size.clock}",
          "lineHeight": 1,
          "color": "{color.text.secondary}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      },
      "compact": {
        "description": "Kompakt opbygning.",
        "styles": {
          "fontSize": "{typography.size.small}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "border": "{border.width.default} solid {color.border.field}",
          "backgroundColor": "{color.background.control}",
          "color": "{color.text.primary}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      },
      "dismiss-compact": {
        "description": "Lukkehandling i en tæt opbygning.",
        "styles": {
          "border": "0",
          "backgroundColor": "transparent",
          "fontSize": "{typography.size.panel}",
          "padding": "{space.component.paddingCompact}",
          "lineHeight": 1,
          "color": "{color.text.secondary}",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}"
        }
      }
    },
    "states": {
      "hover": {
        "styles": {
          "backgroundColor": "var(--ds-interaction-hover-surface)",
          "color": "var(--ds-interaction-hover-text)"
        },
        "description": "Kontrollen under pegemarkøren.",
        "parts": {
          "description": {
            "styles": {
              "color": "inherit"
            }
          }
        }
      },
      "focus": {
        "styles": {
          "outline": "{border.width.focus} solid {color.focus}",
          "outlineOffset": "{border.offset.focus}"
        },
        "description": "Synligt tastaturfokus."
      },
      "active": {
        "styles": {
          "backgroundColor": "var(--ds-interaction-active-surface)",
          "color": "var(--ds-interaction-active-text)"
        },
        "description": "Kontrollen under aktivering.",
        "parts": {
          "description": {
            "styles": {
              "color": "inherit"
            }
          }
        }
      },
      "disabled": {
        "styles": {
          "opacity": "{opacity.disabled}",
          "cursor": "not-allowed"
        },
        "description": "Native deaktiveret kontrol."
      },
      "pressed": {
        "description": "Aktiv toggle med aria-pressed=true.",
        "styles": {
          "backgroundColor": "{color.action.primary}",
          "color": "{color.action.primaryText}",
          "--ds-interaction-hover-surface": "{color.action.primaryHover}",
          "--ds-interaction-hover-text": "{color.action.primaryHoverText}",
          "--ds-interaction-active-surface": "{color.action.primaryActive}",
          "--ds-interaction-active-text": "{color.action.primaryActiveText}"
        },
        "parts": {
          "description": {
            "styles": {
              "color": "inherit"
            }
          }
        }
      },
      "current": {
        "description": "Aktuelt navigationsmål med aria-current; en valgt side er ikke en togglehandling.",
        "styles": {
          "backgroundColor": "{color.background.subtle}",
          "color": "{color.text.primary}",
          "--ds-interaction-hover-surface": "{color.action.selectedHover}",
          "--ds-interaction-hover-text": "{color.action.selectedHoverText}",
          "--ds-interaction-active-surface": "{color.action.selectedActive}",
          "--ds-interaction-active-text": "{color.action.selectedActiveText}"
        },
        "parts": {
          "description": {
            "styles": {
              "color": "inherit"
            }
          }
        }
      }
    },
    "preview": {
      "tag": "button",
      "part": "root",
      "attrs": {
        "type": "button"
      },
      "children": [
        {
          "tag": "span",
          "part": "heading",
          "text": "Gem ændringer"
        },
        {
          "tag": "span",
          "part": "description",
          "text": "En kort forklaring til handlingen."
        }
      ]
    }
  },
  "input": {
    "name": "Tekstinput",
    "description": "Native kontrol til kort, fri tekst.",
    "usage": "Forbind kontrollen med en label. Brug field til label, hjælp og fejl; produktet ejer data og validering.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-input",
        "styles": {
          "boxSizing": "border-box",
          "width": "100%",
          "minHeight": "max(44px, {size.control.height})",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "border": "{border.width.default} solid {color.border.field}",
          "borderRadius": "{radius.control}",
          "backgroundColor": "{color.background.control}",
          "color": "{color.text.primary}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.control}",
          "lineHeight": "{typography.lineHeight.body}",
          "transition": "border-color {duration.fast}"
        }
      }
    },
    "variants": {
      "desktop": {
  "description": "Kompakt desktopbetjening med 32 px klikflader. Brug standardvarianten ved touch eller behov for større mål.",
  "styles": {
    "minHeight": "32px",
    "height": "32px",
    "padding": "{space.component.paddingCompact}"
  }
},
      "invalid": {
        "description": "Synlig valideringsfejl.",
        "styles": {
          "borderColor": "{color.status.danger}"
        }
      },
      "search": {
        "description": "Indtastning til søgning.",
        "styles": {
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "fontSize": "{typography.size.label}",
          "borderRadius": "{radius.note}",
          "width": "100%"
        }
      }
    },
    "states": {
      "focus": {
        "styles": {
          "outline": "{border.width.focus} solid {color.focus}",
          "outlineOffset": "{border.offset.focus}"
        },
        "description": "Synligt tastaturfokus."
      },
      "disabled": {
        "styles": {
          "backgroundColor": "{color.disabled.surface}",
          "color": "{color.disabled.text}",
          "cursor": "not-allowed"
        },
        "description": "Native deaktiveret kontrol."
      }
    },
    "preview": {
      "tag": "input",
      "part": "root",
      "attrs": {
        "type": "text",
        "placeholder": "Skriv en værdi",
        "aria-label": "Eksempelværdi"
      }
    }
  },
  "field": {
    "name": "Formularfelt",
    "description": "Label, native kontrol, hjælp og fejl i én opbygning.",
    "usage": "Renderer forbinder label, kontrol, hjælp og fejl via unikke id’er. Produktet leverer validering og data; disabled og required bruger native attributter.",
    "composes": [
      "input",
      "text"
    ],
    "parts": {
      "root": {
        "selector": ".ds-field",
        "styles": {
          "display": "flex",
          "flexDirection": "column",
          "gap": "{space.component.gap}",
          "fontFamily": "{typography.font.body}"
        }
      },
      "label": {
        "selector": ".ds-field__label",
        "styles": {
          "fontSize": "{typography.size.label}",
          "fontWeight": "{typography.weight.label}",
          "color": "{color.text.primary}",
          "lineHeight": "{typography.lineHeight.label}"
        }
      },
      "control": {
        "selector": ".ds-input",
        "styles": {
          "width": "100%",
          "border": "{border.width.default} solid {color.border.field}"
        }
      },
      "hint": {
        "selector": ".ds-field__hint",
        "styles": {
          "margin": "0",
          "fontSize": "{typography.size.small}",
          "lineHeight": "{typography.lineHeight.body}",
          "color": "{color.text.secondary}"
        }
      },
      "error": {
        "selector": ".ds-field__error",
        "styles": {
          "display": "none",
          "margin": "0",
          "fontSize": "{typography.size.small}",
          "lineHeight": "{typography.lineHeight.body}",
          "color": "{color.status.dangerText}"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {}
      },
      "invalid": {
        "description": "Synlig valideringsfejl.",
        "styles": {},
        "parts": {
          "control": {
            "styles": {
              "borderColor": "{color.status.danger}"
            }
          },
          "error": {
            "styles": {
              "display": "block"
            }
          }
        }
      }
    },
    "states": {
      "focus": {
        "styles": {},
        "parts": {
          "label": {
            "styles": {
              "color": "{color.action.subtleText}"
            }
          }
        },
        "description": "Synligt tastaturfokus."
      },
      "disabled": {
        "styles": {},
        "parts": {
          "label": {
            "styles": {
              "color": "{color.disabled.text}"
            }
          },
          "control": {
            "styles": {
              "backgroundColor": "{color.disabled.surface}",
              "color": "{color.disabled.text}",
              "cursor": "not-allowed"
            }
          }
        },
        "description": "Native deaktiveret kontrol."
      }
    },
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "tag": "label",
          "part": "label",
          "text": "Navn"
        },
        {
          "tag": "input",
          "part": "control",
          "attrs": {
            "type": "text",
            "placeholder": "Skriv dit navn"
          }
        },
        {
          "tag": "p",
          "part": "hint",
          "text": "Brug det navn, du vil vise."
        },
        {
          "tag": "p",
          "part": "error",
          "text": "Udfyld dit navn."
        }
      ]
    }
  },
  "select": {
    "name": "Valgliste",
    "description": "Native kontrol til ét valg fra en kendt liste.",
    "usage": "Forbind select med en label. Brug choice-field til label, hjælp og fejl. Browseren styrer åbning og tastatur.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-select",
        "styles": {
          "boxSizing": "border-box",
          "width": "100%",
          "minHeight": "max(44px, {size.control.height})",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "border": "{border.width.default} solid {color.border.field}",
          "borderRadius": "{radius.control}",
          "backgroundColor": "{color.background.control}",
          "color": "{color.text.primary}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.control}",
          "lineHeight": "{typography.lineHeight.body}"
        }
      }
    },
    "variants": {
      "desktop": {
  "description": "Kompakt desktopbetjening med 32 px klikflader. Brug standardvarianten ved touch eller behov for større mål.",
  "styles": {
    "minHeight": "32px",
    "height": "32px",
    "padding": "{space.component.paddingCompact}"
  }
},
      "invalid": {
        "description": "Synlig valideringsfejl.",
        "styles": {
          "borderColor": "{color.status.danger}"
        }
      },
      "compact": {
        "description": "Kompakt opbygning.",
        "styles": {
          "padding": "{space.component.paddingCompact} {space.component.padding}"
        }
      }
    },
    "states": {
      "focus": {
        "styles": {
          "outline": "{border.width.focus} solid {color.focus}",
          "outlineOffset": "{border.offset.focus}"
        },
        "description": "Synligt tastaturfokus."
      },
      "disabled": {
        "styles": {
          "backgroundColor": "{color.disabled.surface}",
          "color": "{color.disabled.text}",
          "cursor": "not-allowed"
        },
        "description": "Native deaktiveret kontrol."
      }
    },
    "preview": {
      "tag": "select",
      "part": "root",
      "children": [
        {
          "tag": "option",
          "text": "Vælg en mulighed"
        },
        {
          "tag": "option",
          "text": "Mulighed A"
        },
        {
          "tag": "option",
          "text": "Mulighed B"
        }
      ],
      "attrs": {
        "aria-label": "Mulighed"
      }
    }
  },
  "checkbox": {
    "name": "Afkrydsning",
    "description": "Et selvstændigt til- eller fravalg med label.",
    "usage": "Bevar native checkbox og label. Produktet leverer checked, værdi og ændringshåndtering.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-checkbox",
        "styles": {
          "display": "inline-flex",
          "alignItems": "center",
          "gap": "{space.component.gap}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.label}",
          "lineHeight": "{typography.lineHeight.body}",
          "color": "{color.text.primary}",
          "cursor": "pointer",
          "minHeight": "max(44px, {size.control.height})"
        }
      },
      "control": {
        "selector": ".ds-checkbox__control",
        "styles": {
          "width": "{size.checkbox}",
          "height": "{size.checkbox}",
          "margin": "0",
          "accentColor": "{color.action.primary}",
          "cursor": "pointer",
          "flexShrink": "0"
        }
      },
      "label": {
        "selector": ".ds-checkbox__label",
        "styles": {
          "color": "inherit"
        }
      },
      "indicator": {
        "selector": ".ds-checkbox__indicator",
        "styles": {
          "position": "absolute",
          "width": "{size.checkbox.indicator}",
          "height": "{size.checkbox.indicator}",
          "left": "calc(({size.checkbox} - {size.checkbox.indicator}) / 2)",
          "top": "calc(50% - {size.checkbox.indicator} / 2)",
          "transform": "rotate(45deg)",
          "backgroundColor": "{color.brand.accent}",
          "pointerEvents": "none",
          "display": "none"
        }
      }
    },
    "variants": {},
    "states": {
      "focus": {
        "styles": {},
        "parts": {
          "control": {
            "styles": {
              "outline": "{border.width.focus} solid {color.focus}",
              "outlineOffset": "{border.offset.focus}"
            }
          }
        },
        "description": "Synligt tastaturfokus."
      },
      "disabled": {
        "styles": {},
        "parts": {
          "control": {
            "styles": {
              "opacity": "{opacity.disabled}",
              "cursor": "not-allowed"
            }
          },
          "label": {
            "styles": {
              "color": "{color.disabled.text}"
            }
          }
        },
        "description": "Native deaktiveret kontrol."
      },
      "checked": {
        "description": "Native markeret kontrol.",
        "styles": {},
        "parts": {
          "control": {
            "styles": {
              "backgroundColor": "{color.text.primary}"
            }
          },
          "indicator": {
            "styles": {
              "display": "block"
            }
          }
        }
      }
    },
    "preview": {
      "tag": "label",
      "part": "root",
      "children": [
        {
          "tag": "input",
          "part": "control",
          "attrs": {
            "type": "checkbox",
            "checked": true
          }
        },
        {
          "tag": "span",
          "part": "label",
          "text": "Aktivér indstillingen"
        }
      ]
    }
  },
  "card": {
    "name": "Kort",
    "description": "En indholdsflade med valgfri overskrift, indhold og handlinger.",
    "usage": "Sammensæt header, body og footer efter behov. Biblioteket ejer indre afstande og opbygning; temaet ejer udtrykket.",
    "composes": [
      "text",
      "button"
    ],
    "parts": {
      "root": {
        "selector": ".ds-card",
        "styles": {
          "display": "flex",
          "flexDirection": "column",
          "gap": "{space.component.gapLarge}",
          "padding": "{space.component.paddingLarge}",
          "border": "{border.width.default} solid {color.border.default}",
          "borderRadius": "{radius.card}",
          "backgroundColor": "{color.background.surface}",
          "color": "{color.text.primary}",
          "fontFamily": "{typography.font.body}",
          "boxShadow": "none",
          "boxSizing": "border-box",
          "minWidth": "0"
        }
      },
      "header": {
        "selector": ".ds-card__header",
        "styles": {
          "margin": "0",
          "fontFamily": "{typography.font.heading}",
          "fontSize": "{typography.size.title}",
          "fontWeight": "{typography.weight.heading}",
          "lineHeight": "{typography.lineHeight.heading}"
        }
      },
      "body": {
        "selector": ".ds-card__body",
        "styles": {
          "margin": "0",
          "fontSize": "{typography.size.body}",
          "lineHeight": "{typography.lineHeight.body}",
          "color": "{color.text.secondary}"
        }
      },
      "footer": {
        "selector": ".ds-card__footer",
        "styles": {
          "display": "flex",
          "flexWrap": "wrap",
          "alignItems": "center",
          "gap": "{space.component.gapLarge}"
        }
      },
      "text": {
        "selector": ".ds-text",
        "styles": {
          "color": "inherit"
        }
      },
      "action": {
        "selector": ".ds-button",
        "styles": {}
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {}
      },
      "elevated": {
        "description": "Flade med dybde.",
        "styles": {
          "boxShadow": "{shadow.card}"
        }
      },
      "outlined": {
        "description": "Flade med synlig kant.",
        "styles": {
          "boxShadow": "none"
        }
      },
      "subtle-border": {
        "description": "Flade med diskret kant.",
        "styles": {
          "boxShadow": "none"
        }
      },
      "subtle": {
        "description": "Lavt fremhævet flade.",
        "styles": {
          "backgroundColor": "{color.background.subtle}",
          "borderColor": "transparent",
          "boxShadow": "none"
        }
      },
      "inverse": {
        "description": "Omvendt farvehierarki.",
        "styles": {
          "backgroundColor": "{color.background.inverse}",
          "color": "{color.text.inverse}",
          "borderColor": "{color.background.inverse}",
          "boxShadow": "none"
        },
        "parts": {
          "header": {
            "styles": {
              "color": "{color.text.inverse}"
            }
          },
          "body": {
            "styles": {
              "color": "{color.text.inverse}"
            }
          }
        }
      },
      "floating": {
        "description": "Flade over omgivelserne.",
        "styles": {
          "boxShadow": "{shadow.floating}"
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "article",
      "part": "root",
      "children": [
        {
          "tag": "h3",
          "part": "header",
          "text": "Overskrift"
        },
        {
          "tag": "p",
          "part": "body",
          "text": "Indhold og relaterede oplysninger."
        },
        {
          "tag": "footer",
          "part": "footer",
          "text": "Supplerende information"
        }
      ]
    }
  },
  "badge": {
    "name": "Statusmærke",
    "description": "En kompakt tekstmarkering for status eller kategori.",
    "usage": "Skriv en forståelig tekst. Farve kan supplere betydningen, men må ikke være den eneste forklaring.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-badge",
        "styles": {
          "display": "inline-flex",
          "alignItems": "center",
          "gap": "{space.component.gap}",
          "padding": "calc({space.component.paddingCompact} / 2) {space.component.paddingCompact}",
          "borderRadius": "{radius.badge}",
          "backgroundColor": "{color.background.subtle}",
          "color": "{color.text.secondary}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.small}",
          "fontWeight": "{typography.weight.label}",
          "lineHeight": "{typography.lineHeight.control}",
          "border": "{border.width.default} solid transparent"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {}
      },
      "neutral": {
        "description": "Neutral status eller kategori.",
        "styles": {
          "backgroundColor": "{color.background.subtle}",
          "color": "{color.text.secondary}"
        }
      },
      "accent": {
        "description": "Særskilt fremhævning.",
        "styles": {
          "backgroundColor": "{color.action.subtle}",
          "color": "{color.action.subtleText}"
        }
      },
      "danger": {
        "description": "Destruktiv handling eller fejlstatus.",
        "styles": {
          "backgroundColor": "{color.status.dangerSurface}",
          "color": "{color.status.dangerText}"
        }
      },
      "inverse": {
        "description": "Omvendt farvehierarki.",
        "styles": {
          "backgroundColor": "{color.background.inverse}",
          "color": "{color.text.inverse}",
          "borderColor": "{color.background.inverse}"
        }
      },
      "data": {
        "description": "Markering af en oplysning.",
        "styles": {
          "color": "{color.text.primary}",
          "borderColor": "{color.action.primary}",
          "backgroundColor": "{color.background.surface}"
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "span",
      "part": "root",
      "text": "Klar"
    }
  },
  "divider": {
    "name": "Skillelinje",
    "description": "En opdeling mellem beslægtede områder.",
    "usage": "Brug hr til semantisk opdeling. Rent dekorative eller lodrette linjer må ikke ændre læserækkefølgen.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-divider",
        "styles": {
          "width": "100%",
          "height": "0",
          "margin": "{space.4} 0",
          "border": "0",
          "borderTop": "{border.width.default} solid {color.border.default}"
        }
      }
    },
    "variants": {
      "vertical": {
        "description": "Lodret opbygning.",
        "styles": {
          "width": "{border.width.default}",
          "height": "auto",
          "margin": "{space.px4}",
          "border": "0",
          "backgroundColor": "{color.border.default}",
          "alignSelf": "stretch",
          "flexShrink": "0"
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "hr",
      "part": "root"
    }
  },
  "alert": {
    "name": "Besked",
    "description": "En orientering eller fejl med titel og forklaring.",
    "usage": "Produktet bestemmer timing og live-announcement. Biblioteket ejer indre afstande og læserækkefølge.",
    "composes": [
      "text"
    ],
    "parts": {
      "root": {
        "selector": ".ds-alert",
        "styles": {
          "display": "flex",
          "flexDirection": "column",
          "gap": "{space.component.gap}",
          "padding": "{space.component.padding}",
          "border": "{border.width.default} solid {color.border.default}",
          "borderRadius": "{radius.card}",
          "backgroundColor": "{color.background.subtle}",
          "color": "{color.text.primary}",
          "fontFamily": "{typography.font.body}",
          "boxSizing": "border-box",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "title": {
        "selector": ".ds-alert__title",
        "styles": {
          "margin": "0",
          "fontSize": "{typography.size.label}",
          "fontWeight": "{typography.weight.label}"
        }
      },
      "body": {
        "selector": ".ds-alert__body",
        "styles": {
          "margin": "0",
          "fontSize": "{typography.size.body}",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "marker": {
        "selector": ".ds-alert__marker",
        "styles": {
          "width": "{size.notice.marker}",
          "height": "{size.notice.marker}",
          "backgroundColor": "{color.text.primary}",
          "transform": "rotate(45deg)",
          "marginTop": "6px",
          "gridRow": "1 / span 2"
        }
      }
    },
    "variants": {
      "neutral": {
        "description": "Neutral status eller kategori.",
        "styles": {
          "backgroundColor": "{color.background.subtle}"
        }
      },
      "danger": {
        "description": "Destruktiv handling eller fejlstatus.",
        "styles": {
          "backgroundColor": "{color.status.dangerSurface}",
          "color": "{color.status.dangerText}",
          "borderColor": "{color.status.danger}"
        }
      },
      "accent": {
        "description": "Særskilt fremhævning.",
        "styles": {
          "backgroundColor": "{color.action.subtle}",
          "color": "{color.action.subtleText}",
          "borderColor": "{color.action.subtle}"
        },
        "parts": {
          "marker": {
            "styles": {
              "backgroundColor": "{color.brand.accent}"
            }
          }
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "section",
      "part": "root",
      "children": [
        {
          "tag": "strong",
          "part": "title",
          "text": "Ændringer gemt"
        },
        {
          "tag": "p",
          "part": "body",
          "text": "Dine ændringer er nu klar til brug."
        }
      ]
    }
  },
  "dialog": {
    "name": "Dialog",
    "description": "En afgrænset dialog med titel, indhold og handlinger.",
    "usage": "Renderer leverer native dialog med titel og forklaring. Produktet kalder showModal og close; browseren håndterer modal fokusadfærd.",
    "composes": [
      "text",
      "button"
    ],
    "parts": {
      "root": {
        "selector": ".ds-dialog",
        "styles": {
          "boxSizing": "border-box",
          "display": "flex",
          "flexDirection": "column",
          "gap": "{space.component.gapLarge}",
          "width": "100%",
          "maxWidth": "{size.dialog.maxWidth}",
          "padding": "{space.component.paddingLarge}",
          "border": "{border.width.default} solid {color.border.default}",
          "borderRadius": "{radius.card}",
          "backgroundColor": "{color.background.surface}",
          "color": "{color.text.primary}",
          "fontFamily": "{typography.font.body}",
          "boxShadow": "{shadow.floating}"
        }
      },
      "title": {
        "selector": ".ds-dialog__title",
        "styles": {
          "margin": "0",
          "fontFamily": "{typography.font.heading}",
          "fontSize": "{typography.size.title}",
          "fontWeight": "{typography.weight.heading}",
          "lineHeight": "{typography.lineHeight.heading}"
        }
      },
      "body": {
        "selector": ".ds-dialog__body",
        "styles": {
          "margin": "0",
          "fontSize": "{typography.size.body}",
          "lineHeight": "{typography.lineHeight.body}",
          "color": "{color.text.secondary}"
        }
      },
      "footer": {
        "selector": ".ds-dialog__footer",
        "styles": {
          "display": "flex",
          "flexWrap": "wrap",
          "justifyContent": "flex-end",
          "gap": "{space.component.gapLarge}"
        }
      }
    },
    "variants": {},
    "states": {},
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "tag": "h2",
          "part": "title",
          "text": "Bekræft handling"
        },
        {
          "tag": "p",
          "part": "body",
          "text": "Gennemgå oplysningerne, før du fortsætter."
        },
        {
          "tag": "footer",
          "part": "footer",
          "text": "Vælg en handling"
        }
      ]
    }
  },
  "heading": {
    "name": "Overskrift",
    "description": "Et tydeligt niveau i indholdets hierarki.",
    "usage": "Brug h1-h6 efter dokumentets struktur. Visuelle varianter erstatter ikke et korrekt heading-niveau.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-heading",
        "styles": {
          "margin": "0",
          "fontFamily": "{typography.font.heading}",
          "fontSize": "{typography.size.heading}",
          "fontWeight": "{typography.weight.heading}",
          "lineHeight": "{typography.lineHeight.heading}",
          "color": "{color.text.primary}",
          "letterSpacing": "{typography.tracking.display}",
          "overflowWrap": "anywhere"
        }
      }
    },
    "variants": {
      "title": {
        "description": "Titel.",
        "styles": {
          "fontSize": "{typography.size.heading}"
        }
      },
      "subtitle": {
        "description": "Undertitel.",
        "styles": {
          "fontSize": "{typography.size.title}",
          "lineHeight": "{typography.lineHeight.subtitle}",
          "letterSpacing": "0"
        }
      },
      "display": {
        "description": "Fremhævet overskrift.",
        "styles": {
          "fontSize": "clamp(2rem, 5vw, {typography.size.display})",
          "fontWeight": "{typography.weight.display}",
          "lineHeight": "{typography.lineHeight.display}",
          "letterSpacing": "{typography.tracking.display}"
        }
      },
      "section": {
        "description": "Afsnitstitel.",
        "styles": {
          "fontSize": "{typography.size.tiny}",
          "fontWeight": "{typography.weight.strong}",
          "textTransform": "uppercase",
          "letterSpacing": "{typography.tracking.section}",
          "color": "{color.text.secondary}"
        }
      },
      "expressive": {
        "description": "Særskilt typografisk rolle.",
        "styles": {
          "fontFamily": "{typography.font.expressive}",
          "fontSize": "{typography.size.expressive}",
          "fontStyle": "normal",
          "fontWeight": "{typography.weight.expressive}"
        }
      },
      "expressive-large": {
        "description": "Stor, særskilt typografisk rolle.",
        "styles": {
          "fontFamily": "{typography.font.expressive}",
          "fontSize": "clamp(2rem, 5vw, {typography.size.expressiveLarge})",
          "fontStyle": "normal",
          "fontWeight": "{typography.weight.expressive}",
          "lineHeight": 1.15
        }
      },
      "panel": {
        "description": "Kompakt paneltitel.",
        "styles": {
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.panel}",
          "fontWeight": "{typography.weight.strong}"
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "h2",
      "part": "root",
      "text": "En tydelig overskrift"
    }
  },
  "label": {
    "name": "Etiket",
    "description": "En kort tekst, der navngiver en kategori eller et indholdsområde.",
    "usage": "Brug korte, tydelige ord. Formularkontroller skal have en native label via field eller choice-field.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-label",
        "styles": {
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.small}",
          "fontWeight": "{typography.weight.label}",
          "lineHeight": "{typography.lineHeight.label}",
          "letterSpacing": "{typography.tracking.label}",
          "textTransform": "uppercase",
          "color": "{color.text.label}"
        }
      }
    },
    "variants": {},
    "states": {},
    "preview": {
      "tag": "span",
      "part": "root",
      "text": "Kategori"
    }
  },
  "tag": {
    "name": "Mærkat",
    "description": "En kategori eller et valgbart tekstmærke.",
    "usage": "Statiske mærkater bruger span; handlinger bruger native button. Produktet ejer valg og separat fjernelse.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-tag",
        "styles": {
          "display": "inline-flex",
          "alignItems": "center",
          "justifyContent": "center",
          "gap": "{space.component.gap}",
          "minHeight": "max(44px, {size.control.height})",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "border": "{border.width.default} solid {color.border.default}",
          "borderRadius": "{radius.control}",
          "backgroundColor": "transparent",
          "color": "{color.action.subtleText}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.tag}",
          "cursor": "pointer",
          "minWidth": "44px",
          "fontWeight": "{typography.weight.label}",
          "lineHeight": "{typography.lineHeight.control}",
          "boxSizing": "border-box",
          "transition": "background-color {duration.fast}, color {duration.fast}, border-color {duration.fast}"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {}
      },
      "selected": {
        "description": "Valgt mærkat.",
        "styles": {
          "backgroundColor": "{color.action.primary}",
          "color": "{color.action.primaryText}",
          "borderColor": "{color.action.primary}"
        }
      }
    },
    "states": {
      "hover": {
        "description": "Kontrollen under pegemarkøren.",
        "styles": {
          "backgroundColor": "{color.action.subtle}",
          "color": "{color.text.primary}"
        }
      },
      "focus": {
        "description": "Synligt tastaturfokus.",
        "styles": {
          "outline": "{border.width.focus} solid {color.focus}",
          "outlineOffset": "{border.offset.focus}"
        }
      },
      "disabled": {
        "description": "Native deaktiveret kontrol.",
        "styles": {
          "opacity": "{opacity.disabled}",
          "cursor": "not-allowed"
        }
      }
    },
    "preview": {
      "tag": "button",
      "part": "root",
      "text": "Kategori",
      "attrs": {
        "type": "button"
      }
    }
  },
  "radio": {
    "name": "Radiovalg",
    "description": "Én mulighed i en gruppe, hvor højst én kan vælges.",
    "usage": "Bevar native radio, fælles name og label. Produktet navngiver gruppen og leverer den valgte værdi.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-radio",
        "styles": {
          "display": "inline-flex",
          "alignItems": "center",
          "gap": "{space.component.gap}",
          "minHeight": "max(44px, {size.control.height})",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.control}",
          "color": "{color.text.primary}",
          "cursor": "pointer",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "control": {
        "selector": ".ds-radio__control",
        "styles": {
          "width": "{size.checkbox}",
          "height": "{size.checkbox}",
          "margin": "0",
          "accentColor": "{color.action.primary}",
          "borderRadius": "{radius.radio}",
          "flexShrink": "0",
          "cursor": "pointer"
        }
      },
      "label": {
        "selector": ".ds-radio__label",
        "styles": {
          "color": "inherit"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {}
      }
    },
    "states": {
      "focus": {
        "description": "Synligt tastaturfokus.",
        "styles": {},
        "parts": {
          "control": {
            "styles": {
              "outline": "{border.width.focus} solid {color.focus}",
              "outlineOffset": "{border.offset.focus}"
            }
          }
        }
      },
      "disabled": {
        "description": "Native deaktiveret kontrol.",
        "styles": {
          "opacity": "{opacity.disabled}",
          "cursor": "not-allowed"
        },
        "parts": {
          "control": {
            "styles": {
              "cursor": "not-allowed"
            }
          }
        }
      }
    },
    "preview": {
      "tag": "label",
      "part": "root",
      "children": [
        {
          "tag": "input",
          "part": "control",
          "attrs": {
            "type": "radio",
            "checked": true
          }
        },
        {
          "tag": "span",
          "part": "label",
          "text": "Mulighed A"
        }
      ]
    }
  },
  "switch": {
    "name": "Kontakt",
    "description": "En navngivet indstilling med til- og fratilstand.",
    "usage": "Bevar native checkbox med role=switch og label. Checked angiver tilstanden; produktet ejer virkningen.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-switch",
        "styles": {
          "display": "inline-flex",
          "position": "relative",
          "alignItems": "center",
          "gap": "{space.component.gap}",
          "minHeight": "max(44px, {size.control.height})",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.control}",
          "color": "{color.text.primary}",
          "cursor": "pointer",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "control": {
        "selector": ".ds-switch__control",
        "styles": {
          "position": "absolute",
          "left": "0",
          "width": "{size.switch.width}",
          "height": "{size.switch.height}",
          "opacity": 0,
          "margin": "0",
          "cursor": "pointer"
        }
      },
      "track": {
        "selector": ".ds-switch__track",
        "styles": {
          "position": "relative",
          "boxSizing": "border-box",
          "display": "block",
          "width": "{size.switch.width}",
          "height": "{size.switch.height}",
          "border": "{border.width.default} solid {color.border.strong}",
          "borderRadius": "{radius.pill}",
          "backgroundColor": "{color.background.subtle}",
          "pointerEvents": "none",
          "flexShrink": "0",
          "transition": "background-color {duration.base}, border-color {duration.base}"
        }
      },
      "thumb": {
        "selector": ".ds-switch__thumb",
        "styles": {
          "position": "absolute",
          "top": "{size.switch.inset}",
          "left": "{size.switch.inset}",
          "width": "{size.switch.thumb}",
          "height": "{size.switch.thumb}",
          "backgroundColor": "{color.text.primary}",
          "transition": "left {duration.base} cubic-bezier(0.2,0,0.2,1), background-color {duration.base} cubic-bezier(0.2,0,0.2,1)",
          "borderRadius": "{radius.pill}"
        }
      },
      "label": {
        "selector": ".ds-switch__label",
        "styles": {
          "color": "inherit"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {}
      }
    },
    "states": {
      "checked": {
        "description": "Native markeret kontrol.",
        "styles": {},
        "parts": {
          "track": {
            "styles": {
              "backgroundColor": "{color.action.primary}",
              "borderColor": "{color.action.primary}"
            }
          },
          "thumb": {
            "styles": {
              "left": "calc({size.switch.width} - {size.switch.thumb} - {size.switch.inset} - 2 * {border.width.default})",
              "backgroundColor": "{color.action.primaryText}"
            }
          }
        }
      },
      "focus": {
        "description": "Synligt tastaturfokus.",
        "styles": {},
        "parts": {
          "track": {
            "styles": {
              "outline": "{border.width.focus} solid {color.focus}",
              "outlineOffset": "{border.offset.focus}"
            }
          }
        }
      },
      "disabled": {
        "description": "Native deaktiveret kontrol.",
        "styles": {
          "opacity": "{opacity.disabled}",
          "cursor": "not-allowed"
        },
        "parts": {
          "control": {
            "styles": {
              "cursor": "not-allowed"
            }
          }
        }
      }
    },
    "preview": {
      "tag": "label",
      "part": "root",
      "children": [
        {
          "tag": "input",
          "part": "control",
          "attrs": {
            "type": "checkbox",
            "checked": true
          }
        },
        {
          "tag": "span",
          "part": "track",
          "children": [
            {
              "tag": "span",
              "part": "thumb"
            }
          ]
        },
        {
          "tag": "span",
          "part": "label",
          "text": "Aktivér indstillingen"
        }
      ]
    }
  },
  "choice-field": {
    "name": "Valgfelt",
    "description": "Label, native valgliste, hjælp og fejl i én opbygning.",
    "usage": "Native select styrer valg og tastatur. Renderer forbinder label, hjælp og fejl; produktet leverer muligheder og validering.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-choice-field",
        "styles": {
          "display": "flex",
          "flexDirection": "column",
          "gap": "{space.component.gap}",
          "width": "100%",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.control}"
        }
      },
      "list": {
        "selector": ".ds-choice-field__list",
        "styles": {
          "display": "none",
          "border": "{border.width.default} solid {color.border.default}",
          "backgroundColor": "{color.background.canvas}"
        }
      },
      "option": {
        "selector": ".ds-choice-field__option",
        "styles": {
          "display": "flex",
          "alignItems": "center",
          "minHeight": "{size.control.height}",
          "padding": "{space.component.paddingCompact}",
          "border": "0",
          "borderBottom": "{border.width.default} solid {color.border.default}",
          "borderRadius": "{radius.control}",
          "backgroundColor": "{color.background.canvas}",
          "color": "{color.text.primary}",
          "textAlign": "left",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.control}",
          "cursor": "pointer"
        }
      },
      "control": {
        "selector": ".ds-choice-field__control",
        "styles": {
          "boxSizing": "border-box",
          "width": "100%",
          "minHeight": "max(44px, {size.control.height})",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "border": "{border.width.default} solid {color.border.field}",
          "borderRadius": "{radius.control}",
          "backgroundColor": "{color.background.control}",
          "color": "{color.text.primary}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.control}",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "label": {
        "selector": ".ds-choice-field__label",
        "styles": {
          "fontSize": "{typography.size.label}",
          "fontWeight": "{typography.weight.label}",
          "color": "{color.text.primary}",
          "lineHeight": "{typography.lineHeight.label}"
        }
      },
      "hint": {
        "selector": ".ds-choice-field__hint",
        "styles": {
          "margin": "0",
          "fontSize": "{typography.size.small}",
          "color": "{color.text.secondary}",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "error": {
        "selector": ".ds-choice-field__error",
        "styles": {
          "display": "none",
          "margin": "0",
          "fontSize": "{typography.size.small}",
          "color": "{color.status.dangerText}",
          "lineHeight": "{typography.lineHeight.body}"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {},
        "parts": {
          "list": {
            "styles": {
              "display": "flex",
              "flexDirection": "column"
            }
          }
        }
      },
      "invalid": {
        "description": "Synlig valideringsfejl.",
        "styles": {},
        "parts": {
          "control": {
            "styles": {
              "borderColor": "{color.status.danger}"
            }
          },
          "error": {
            "styles": {
              "display": "block"
            }
          }
        }
      }
    },
    "states": {
      "focus": {
        "description": "Synligt tastaturfokus.",
        "styles": {},
        "parts": {
          "control": {
            "styles": {
              "outline": "{border.width.focus} solid {color.focus}",
              "outlineOffset": "{border.offset.focus}"
            }
          }
        }
      }
    },
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "tag": "label",
          "part": "label",
          "text": "Mulighed"
        },
        {
          "tag": "select",
          "part": "control",
          "children": [
            {
              "tag": "option",
              "part": "option",
              "text": "Mulighed A",
              "attrs": {
                "value": "a"
              }
            },
            {
              "tag": "option",
              "part": "option",
              "text": "Mulighed B",
              "attrs": {
                "value": "b"
              }
            }
          ]
        },
        {
          "tag": "p",
          "part": "hint",
          "text": "Vælg én mulighed."
        },
        {
          "tag": "p",
          "part": "error",
          "text": "Vælg en mulighed."
        }
      ]
    }
  },
  "toolbar": {
    "name": "Handlingsgruppe",
    "description": "En samlet gruppe af beslægtede handlinger.",
    "usage": "Brug native knapper. Biblioteket ejer orientering og afstande; produktet ejer gruppens formål og handlinger.",
    "composes": [
      "card",
      "button",
      "action-button",
      "divider"
    ],
    "parts": {
      "root": {
        "selector": ".ds-toolbar",
        "styles": {
          "backgroundColor": "{color.background.surface}",
          "border": "{border.width.default} solid {color.border.default}",
          "borderRadius": "{radius.card}",
          "boxShadow": "none",
          "boxSizing": "border-box",
          "padding": "{space.component.paddingCompact}",
          "gap": "{space.component.gap}",
          "display": "flex",
          "flexWrap": "wrap",
          "alignItems": "center",
          "minWidth": "0"
        }
      },
      "action": {
        "selector": ".ds-toolbar__action",
        "styles": {
          "fontFamily": "{typography.font.body}",
          "fontWeight": "{typography.weight.label}",
          "fontSize": "{typography.size.control}",
          "lineHeight": "{typography.lineHeight.control}",
          "color": "{color.text.primary}",
          "border": "{border.width.default} solid {color.border.field}",
          "backgroundColor": "{color.background.control}",
          "borderRadius": "{radius.control}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "cursor": "pointer",
          "minHeight": "max(44px, {size.control.height})",
          "display": "inline-flex",
          "alignItems": "center",
          "justifyContent": "center",
          "gap": "{space.component.gap}",
          "minWidth": "min-content",
          "boxSizing": "border-box",
          "transition": "background-color {duration.fast}",
          "maxWidth": "100%",
          "whiteSpace": "normal",
          "overflowWrap": "normal",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}",
          "wordBreak": "normal"
        }
      }
    },
    "variants": {
      "desktop": {
  "description": "Kompakt desktopbetjening med 32 px klikflader. Brug standardvarianten ved touch eller behov for større mål.",
  "styles": {
    "padding": "{space.component.paddingCompact}",
    "gap": "{space.component.gap}"
  }
},
      "horizontal": {
        "description": "Vandret opbygning.",
        "styles": {
          "display": "flex",
          "flexDirection": "row"
        }
      },
      "vertical": {
        "description": "Lodret opbygning.",
        "styles": {
          "display": "flex",
          "flexDirection": "column",
          "alignItems": "stretch",
          "flexWrap": "nowrap"
        }
      }
    },
    "states": {
      "hover": {
        "description": "En handling under pegemarkøren.",
        "styles": {},
        "parts": {
          "action": {
            "styles": {
              "backgroundColor": "var(--ds-interaction-hover-surface)",
              "color": "var(--ds-interaction-hover-text)"
            }
          }
        }
      },
      "active": {
        "description": "En handling under aktivering.",
        "styles": {},
        "parts": {
          "action": {
            "styles": {
              "backgroundColor": "var(--ds-interaction-active-surface)",
              "color": "var(--ds-interaction-active-text)"
            }
          }
        }
      }
    },
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "tag": "button",
          "part": "action",
          "text": "Tilføj",
          "attrs": {
            "type": "button"
          }
        },
        {
          "tag": "button",
          "part": "action",
          "text": "Redigér",
          "attrs": {
            "type": "button"
          }
        },
        {
          "tag": "button",
          "part": "action",
          "text": "Fjern",
          "attrs": {
            "type": "button"
          }
        }
      ],
      "variant": "horizontal"
    }
  },
  "action-button": {
    "name": "Handlingsknap",
    "description": "En native knap med label og valgfrit ikon og genvej.",
    "usage": "Label navngiver handlingen. Ikon og genvej supplerer label. Ikonknapper kræver et tilgængeligt navn; togglehandlinger bruger aria-pressed.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-action-button",
        "styles": {
          "fontFamily": "{typography.font.body}",
          "fontWeight": "{typography.weight.label}",
          "fontSize": "{typography.size.control}",
          "color": "{color.text.secondary}",
          "backgroundColor": "{color.background.control}",
          "border": "{border.width.default} solid {color.border.field}",
          "borderRadius": "{radius.actionButton}",
          "cursor": "pointer",
          "display": "inline-flex",
          "alignItems": "center",
          "justifyContent": "center",
          "gap": "{space.component.gap}",
          "padding": "{space.component.paddingCompact}",
          "minHeight": "max(44px, {size.control.height})",
          "minWidth": "44px",
          "lineHeight": "{typography.lineHeight.control}",
          "boxSizing": "border-box",
          "transition": "background-color {duration.fast}, color {duration.fast}",
          "maxWidth": "100%",
          "whiteSpace": "normal",
          "overflowWrap": "normal",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}",
          "wordBreak": "normal"
        }
      },
      "icon": {
        "selector": ".ds-action-button__icon",
        "styles": {
          "width": "{size.icon.action}",
          "height": "{size.icon.action}",
          "display": "inline-flex",
          "alignItems": "center",
          "justifyContent": "center",
          "flexShrink": "0",
          "fontSize": "{typography.size.title}",
          "lineHeight": 1
        }
      },
      "shortcut": {
        "selector": ".ds-action-button__shortcut",
        "styles": {
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.shortcut}",
          "opacity": "{opacity.shortcut}",
          "border": "{border.width.default} solid {color.border.default}",
          "borderRadius": "{radius.note}",
          "padding": "0 {space.1}",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "label": {
        "selector": ".ds-action-button__label",
        "styles": {
          "color": "inherit",
          "minWidth": "0",
          "maxWidth": "100%",
          "whiteSpace": "normal",
          "overflowWrap": "normal",
          "wordBreak": "normal"
        }
      },
      "asset": {
        "selector": ".ds-action-button__asset",
        "styles": {
          "display": "block",
          "width": "100%",
          "height": "100%",
          "objectFit": "contain"
        }
      }
    },
    "variants": {
      "tool": {"description":"Kompakt, neutral værktøjsknap med symbol over en 13 px label. Brug korte handlingsnavne i en værktøjslinje; pressed markerer det aktive værktøj.","styles":{"display":"inline-flex","flexDirection":"column","alignItems":"center","justifyContent":"center","minWidth":"56px","minHeight":"52px","width":"auto","gap":"{space.component.gap}","padding":"{space.1} {space.component.paddingCompact}","fontSize":"{typography.size.toolLabel}","lineHeight":1.3,"color":"{color.text.primary}","backgroundColor":"{color.background.control}","borderColor":"transparent","borderRadius":"{radius.control}"},"parts":{"icon":{"styles":{"width":"{size.icon.compact}","height":"{size.icon.compact}","fontSize":"{size.icon.compact}"}},"label":{"styles":{"fontSize":"{typography.size.toolLabel}","lineHeight":1.3}}}},
      "vertical": {
        "description": "Lodret opbygning.",
        "styles": {
          "display": "flex",
          "flexDirection": "column",
          "alignItems": "center",
          "width": "auto",
          "gap": "{space.component.gap}",
          "padding": "{space.component.paddingCompact}",
          "minWidth": "min(100%, {size.actionButton.width})",
          "maxWidth": "100%"
        }
      },
      "horizontal": {
        "description": "Vandret opbygning.",
        "styles": {
          "display": "flex",
          "alignItems": "center",
          "gap": "{space.component.gap}",
          "padding": "{space.component.paddingCompact}",
          "borderRadius": "{radius.control}",
          "color": "{color.text.primary}"
        },
        "parts": {
          "icon": {
            "styles": {
              "width": "{size.icon.compact}",
              "height": "{size.icon.compact}"
            }
          },
          "shortcut": {
            "styles": {
              "fontWeight": "{typography.weight.strong}",
              "color": "{color.text.secondary}",
              "opacity": 1
            }
          }
        }
      },
      "icon-only": {
        "description": "Kun ikon med et tilgængeligt navn.",
        "styles": {
          "display": "inline-flex",
          "alignItems": "center",
          "justifyContent": "center",
          "padding": "{space.component.paddingCompact}"
        },
        "parts": {
          "label": {
            "styles": {
              "display": "none"
            }
          },
          "shortcut": {
            "styles": {
              "display": "none"
            }
          }
        }
      }
    },
    "states": {
      "hover": {
        "description": "Kontrollen under pegemarkøren.",
        "styles": {
          "backgroundColor": "var(--ds-interaction-hover-surface)",
          "color": "var(--ds-interaction-hover-text)"
        },
        "parts": {
          "shortcut": {
            "styles": {
              "color": "inherit"
            }
          }
        }
      },
      "focus": {
        "description": "Synligt tastaturfokus.",
        "styles": {
          "outline": "{border.width.focus} solid {color.focus}",
          "outlineOffset": "{border.offset.focus}"
        }
      },
      "disabled": {
        "description": "Native deaktiveret kontrol.",
        "styles": {
          "opacity": "{opacity.disabled}",
          "cursor": "default"
        }
      },
      "pressed": {
        "description": "Aktiv toggle med aria-pressed=true.",
        "styles": {
          "backgroundColor": "{color.action.primary}",
          "color": "{color.action.primaryText}",
          "borderColor": "{color.action.primary}",
          "--ds-interaction-hover-surface": "{color.action.primaryHover}",
          "--ds-interaction-hover-text": "{color.action.primaryHoverText}",
          "--ds-interaction-active-surface": "{color.action.primaryActive}",
          "--ds-interaction-active-text": "{color.action.primaryActiveText}"
        },
        "parts": {
          "shortcut": {
            "styles": {
              "color": "{color.action.primaryText}"
            }
          }
        }
      },
      "active": {
        "description": "Kontrollen under aktivering.",
        "styles": {
          "backgroundColor": "var(--ds-interaction-active-surface)",
          "color": "var(--ds-interaction-active-text)"
        },
        "parts": {
          "shortcut": {
            "styles": {
              "color": "inherit"
            }
          }
        }
      }
    },
    "preview": {
      "tag": "button",
      "part": "root",
      "children": [
        {
          "tag": "span",
          "part": "icon",
          "text": "+",
          "attrs": {
            "aria-hidden": "true"
          }
        },
        {
          "tag": "span",
          "part": "label",
          "text": "Tilføj"
        },
        {
          "tag": "span",
          "part": "shortcut",
          "text": "Alt+N",
          "attrs": {
            "aria-hidden": "true"
          }
        }
      ],
      "attrs": {
        "type": "button"
      },
      "variant": "horizontal"
    }
  },
  "segmented-option": {
    "name": "Segmentvalg",
    "description": "En navngivet mulighed i et kompakt sæt beslægtede valg.",
    "usage": "Brug native button med aria-pressed til indholdsvalg. Navigation bruger links; en selvstændig indstilling bruger switch.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-segmented-option",
        "styles": {
          "flex": 1,
          "border": "0",
          "backgroundColor": "transparent",
          "borderRadius": "{radius.segment}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.label}",
          "fontWeight": "{typography.weight.label}",
          "color": "{color.text.secondary}",
          "cursor": "pointer",
          "minHeight": "max(44px, {size.control.height})",
          "minWidth": "min-content",
          "lineHeight": "{typography.lineHeight.control}",
          "transition": "background-color {duration.fast}, color {duration.fast}, box-shadow {duration.fast}",
          "maxWidth": "100%",
          "boxSizing": "border-box",
          "whiteSpace": "normal",
          "overflowWrap": "normal",
          "--ds-interaction-hover-surface": "{color.action.neutralHover}",
          "--ds-interaction-hover-text": "{color.action.neutralHoverText}",
          "--ds-interaction-active-surface": "{color.action.neutralActive}",
          "--ds-interaction-active-text": "{color.action.neutralActiveText}",
          "wordBreak": "normal"
        }
      }
    },
    "variants": {
      "desktop": {
  "description": "Kompakt desktopbetjening med 32 px klikflader. Brug standardvarianten ved touch eller behov for større mål.",
  "styles": {
    "minHeight": "32px",
    "padding": "{space.component.paddingCompact} {space.component.padding}"
  }
},
      "compact": {
        "description": "Kompakt opbygning.",
        "styles": {
          "fontSize": "{typography.size.small}",
          "padding": "{space.component.paddingCompact}"
        }
      },
      "dense": {
        "description": "Tæt opbygning.",
        "styles": {
          "padding": "{space.component.paddingCompact}",
          "fontSize": "{typography.size.tiny}"
        }
      }
    },
    "states": {
      "hover": {
        "description": "Kontrollen under pegemarkøren.",
        "styles": {
          "backgroundColor": "var(--ds-interaction-hover-surface)",
          "color": "var(--ds-interaction-hover-text)"
        }
      },
      "focus": {
        "description": "Synligt tastaturfokus.",
        "styles": {
          "outline": "{border.width.focus} solid {color.focus}",
          "outlineOffset": "{border.offset.focus}"
        }
      },
      "disabled": {
        "description": "Native deaktiveret kontrol.",
        "styles": {
          "opacity": "{opacity.disabled}",
          "cursor": "default"
        }
      },
      "pressed": {
        "description": "Aktiv toggle med aria-pressed=true.",
        "styles": {
          "backgroundColor": "{color.background.control}",
          "color": "{color.text.primary}",
          "boxShadow": "{shadow.selected}",
          "--ds-interaction-hover-surface": "{color.action.selectedHover}",
          "--ds-interaction-hover-text": "{color.action.selectedHoverText}",
          "--ds-interaction-active-surface": "{color.action.selectedActive}",
          "--ds-interaction-active-text": "{color.action.selectedActiveText}"
        }
      },
      "active": {
        "description": "Kontrollen under aktivering.",
        "styles": {
          "backgroundColor": "var(--ds-interaction-active-surface)",
          "color": "var(--ds-interaction-active-text)"
        }
      }
    },
    "preview": {
      "tag": "button",
      "part": "root",
      "text": "Mulighed A",
      "attrs": {
        "type": "button",
        "aria-pressed": "false"
      }
    }
  },
  "segmented-control": {
    "name": "Segmentgruppe",
    "description": "En kompakt gruppe af beslægtede indholdsvalg.",
    "usage": "Brug native segmentknapper og et tilgængeligt gruppenavn. Produktet håndterer valg; pressed beskriver hver knaps tilstand.",
    "composes": [
      "segmented-option"
    ],
    "parts": {
      "root": {
        "selector": ".ds-segmented-control",
        "styles": {
          "display": "flex",
          "backgroundColor": "{color.background.subtle}",
          "borderRadius": "{radius.control}",
          "padding": "{space.1}",
          "gap": "{space.1}",
          "minWidth": "0",
          "maxWidth": "100%",
          "boxSizing": "border-box",
          "flexWrap": "wrap"
        }
      },
      "option": {
        "selector": ".ds-segmented-option",
        "styles": {
          "minHeight": "max(44px, {size.control.height})",
          "flex": "1 1 0",
          "minWidth": "min-content",
          "maxWidth": "100%",
          "whiteSpace": "normal",
          "overflowWrap": "normal",
          "wordBreak": "normal"
        }
      },
      "preview-choice": {
        "selector": ".ds-segmented-control__preview-choice",
        "styles": {
          "flex": "1 1 0",
          "border": "0",
          "backgroundColor": "{color.background.control}",
          "borderRadius": "{radius.segment}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.label}",
          "fontWeight": "{typography.weight.label}",
          "color": "{color.text.primary}",
          "cursor": "pointer",
          "boxShadow": "{shadow.selected}",
          "minHeight": "max(44px, {size.control.height})",
          "lineHeight": "{typography.lineHeight.control}",
          "minWidth": "min-content",
          "maxWidth": "100%",
          "boxSizing": "border-box",
          "whiteSpace": "normal",
          "overflowWrap": "normal",
          "--ds-interaction-hover-surface": "{color.action.selectedHover}",
          "--ds-interaction-hover-text": "{color.action.selectedHoverText}",
          "--ds-interaction-active-surface": "{color.action.selectedActive}",
          "--ds-interaction-active-text": "{color.action.selectedActiveText}",
          "wordBreak": "normal"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {}
      },
      "wrap": {
        "description": "Valg fordeles efter tekstens bredde og bryder til næste række ved pladsmangel.",
        "styles": {
          "flexWrap": "wrap",
          "gap": "{space.component.gap}"
        },
        "parts": {
          "option": {
            "styles": {
              "flex": "1 1 auto"
            }
          },
          "preview-choice": {
            "styles": {
              "flex": "1 1 auto"
            }
          }
        }
      }
    },
    "states": {
      "hover": {
        "description": "Valget under pegemarkøren.",
        "styles": {},
        "parts": {
          "preview-choice": {
            "styles": {
              "backgroundColor": "var(--ds-interaction-hover-surface)",
              "color": "var(--ds-interaction-hover-text)"
            }
          }
        }
      },
      "active": {
        "description": "Valget under aktivering.",
        "styles": {},
        "parts": {
          "preview-choice": {
            "styles": {
              "backgroundColor": "var(--ds-interaction-active-surface)",
              "color": "var(--ds-interaction-active-text)"
            }
          }
        }
      }
    },
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "tag": "button",
          "part": "preview-choice",
          "text": "Mulighed A",
          "attrs": {
            "type": "button",
            "aria-pressed": "true"
          }
        },
        {
          "tag": "button",
          "part": "option",
          "text": "Mulighed B",
          "attrs": {
            "type": "button",
            "aria-pressed": "false"
          }
        },
        {
          "tag": "button",
          "part": "option",
          "text": "Mulighed C",
          "attrs": {
            "type": "button",
            "aria-pressed": "false"
          }
        }
      ],
      "attrs": {
        "role": "group",
        "aria-label": "Muligheder"
      }
    }
  },
  "range-field": {
    "name": "Skyderfelt",
    "description": "Label, native skyder, synlig værdi og kort hjælp.",
    "usage": "Forbind label og hjælp med kontrollens ID. Produktet angiver min, max, step og eventuel enhed og håndterer ændringer.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-range-field",
        "styles": {
          "fontFamily": "{typography.font.body}",
          "display": "flex",
          "flexDirection": "column",
          "gap": "{space.component.gap}",
          "color": "{color.text.primary}"
        }
      },
      "label": {
        "selector": ".ds-range-field__label",
        "styles": {
          "display": "flex",
          "justifyContent": "space-between",
          "fontWeight": "{typography.weight.label}",
          "fontSize": "{typography.size.label}",
          "alignItems": "center",
          "gap": "{space.component.gap}",
          "lineHeight": "{typography.lineHeight.label}"
        }
      },
      "value": {
        "selector": ".ds-range-field__value",
        "styles": {
          "fontWeight": "{typography.weight.strong}",
          "backgroundColor": "{color.background.subtle}",
          "borderRadius": "{radius.note}",
          "padding": "0 {space.component.paddingCompact}",
          "fontSize": "{typography.size.small}"
        }
      },
      "control": {
        "selector": ".ds-range-field__control",
        "styles": {
          "width": "100%",
          "accentColor": "{color.action.primary}",
          "margin": "0",
          "minHeight": "max(44px, {size.control.height})",
          "cursor": "pointer"
        }
      },
      "hint": {
        "selector": ".ds-range-field__hint",
        "styles": {
          "fontSize": "{typography.size.small}",
          "color": "{color.text.secondary}",
          "margin": "0",
          "lineHeight": "{typography.lineHeight.body}"
        }
      }
    },
    "variants": {},
    "states": {
      "focus": {
        "description": "Synligt tastaturfokus.",
        "styles": {},
        "parts": {
          "control": {
            "styles": {
              "outline": "{border.width.focus} solid {color.focus}",
              "outlineOffset": "{border.offset.focus}"
            }
          }
        }
      },
      "disabled": {
        "description": "Native deaktiveret kontrol.",
        "styles": {
          "opacity": "{opacity.disabled}"
        }
      }
    },
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "tag": "label",
          "part": "label",
          "text": "Niveau",
          "children": [
            {
              "tag": "span",
              "part": "value",
              "text": "50"
            }
          ]
        },
        {
          "tag": "input",
          "part": "control",
          "attrs": {
            "type": "range",
            "value": "50",
            "min": "0",
            "max": "100",
            "step": "1"
          }
        },
        {
          "tag": "p",
          "part": "hint",
          "text": "Justér værdien med skyderen."
        }
      ]
    }
  },
  "instruction-note": {
    "name": "Hjælpetekst",
    "description": "En kort vejledning tæt på det relevante indhold.",
    "usage": "Skriv kort og konkret. Brug alert til særskilt status eller fejlhåndtering.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-instruction-note",
        "styles": {
          "fontSize": "{typography.size.small}",
          "color": "{color.text.secondary}",
          "backgroundColor": "{color.background.subtle}",
          "borderRadius": "{radius.note}",
          "padding": "{space.component.padding}",
          "lineHeight": "{typography.lineHeight.note}",
          "boxSizing": "border-box",
          "margin": "0",
          "fontFamily": "{typography.font.body}"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {}
      },
      "warning": {
        "description": "Et forhold kræver opmærksomhed.",
        "styles": {
          "backgroundColor": "{color.status.dangerSurface}",
          "color": "{color.status.dangerText}"
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "p",
      "part": "root",
      "text": "Vælg en mulighed for at fortsætte."
    }
  },
  "metric-row": {
    "name": "Nøgletal",
    "description": "En navngivet værdi med tydelig sammenhæng mellem label og resultat.",
    "usage": "Brug native dl, dt og dd. Produktet vælger enheder og lokal talformatering.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-metric-row",
        "styles": {
          "display": "flex",
          "justifyContent": "space-between",
          "padding": "{space.component.paddingCompact}",
          "borderBottom": "{border.width.default} solid {color.border.default}",
          "margin": "0",
          "gap": "{space.component.gap}",
          "fontFamily": "{typography.font.body}",
          "color": "{color.text.primary}",
          "alignItems": "baseline",
          "lineHeight": "{typography.lineHeight.body}",
          "flexWrap": "wrap"
        }
      },
      "label": {
        "selector": ".ds-metric-row__label",
        "styles": {
          "margin": "0",
          "color": "{color.text.secondary}",
          "fontSize": "{typography.size.control}"
        }
      },
      "value": {
        "selector": ".ds-metric-row__value",
        "styles": {
          "fontWeight": "{typography.weight.heading}",
          "margin": "0",
          "fontSize": "{typography.size.title}",
          "whiteSpace": "nowrap"
        }
      }
    },
    "variants": {
      "compact": {
        "description": "Kompakt opbygning.",
        "styles": {
          "gap": "{space.component.gap}",
          "border": "{border.width.default} solid {color.border.default}",
          "borderRadius": "{radius.note}",
          "backgroundColor": "{color.background.detail}",
          "padding": "{space.component.paddingCompact}",
          "fontSize": "{typography.size.control}"
        },
        "parts": {
          "value": {
            "styles": {
              "fontWeight": "{typography.weight.label}",
              "fontSize": "{typography.size.control}"
            }
          }
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "dl",
      "part": "root",
      "children": [
        {
          "tag": "dt",
          "part": "label",
          "text": "Antal"
        },
        {
          "tag": "dd",
          "part": "value",
          "text": "24"
        }
      ]
    }
  },
  "inspector": {
    "name": "Detaljepanel",
    "description": "Titel, forklaring og afsnit om en valgt post.",
    "usage": "Sammensæt felter, værdier og handlinger. Produktet ejer valg og redigering; biblioteket ejer panelopbygning og afstande.",
    "composes": [
      "card",
      "heading",
      "field",
      "range-field",
      "segmented-control",
      "metric-row",
      "instruction-note"
    ],
    "parts": {
      "root": {
        "selector": ".ds-inspector",
        "styles": {
          "backgroundColor": "{color.background.surface}",
          "border": "{border.width.default} solid {color.border.default}",
          "borderRadius": "{radius.card}",
          "boxShadow": "none",
          "boxSizing": "border-box",
          "padding": "{space.component.paddingLarge}",
          "display": "flex",
          "flexDirection": "column",
          "gap": "{space.component.gapLarge}",
          "color": "{color.text.primary}",
          "fontFamily": "{typography.font.body}",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "header": {
        "selector": ".ds-inspector__header",
        "styles": {
          "fontFamily": "{typography.font.heading}",
          "fontSize": "{typography.size.panel}",
          "fontWeight": "{typography.weight.heading}",
          "lineHeight": "{typography.lineHeight.heading}",
          "margin": "0"
        }
      },
      "description": {
        "selector": ".ds-inspector__description",
        "styles": {
          "color": "{color.text.secondary}",
          "fontSize": "{typography.size.control}",
          "margin": "0",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "section": {
        "selector": ".ds-inspector__section",
        "styles": {
          "fontSize": "{typography.size.tiny}",
          "fontWeight": "{typography.weight.strong}",
          "textTransform": "uppercase",
          "letterSpacing": "{typography.tracking.section}",
          "color": "{color.text.secondary}",
          "margin": "0"
        }
      }
    },
    "variants": {},
    "states": {},
    "preview": {
      "tag": "section",
      "part": "root",
      "children": [
        {
          "tag": "h3",
          "part": "header",
          "text": "Detaljer"
        },
        {
          "tag": "p",
          "part": "description",
          "text": "Oplysninger om den valgte post."
        },
        {
          "tag": "h3",
          "part": "section",
          "text": "Egenskaber"
        },
        {
          "tag": "p",
          "text": "Navn, status og øvrige oplysninger."
        }
      ]
    }
  },
  "tooltip": {
    "name": "Værktøjstip",
    "description": "En kort, supplerende forklaring til en kontrol.",
    "usage": "Forbind kontrollen via aria-describedby. Produktet styrer visning og placering; et tooltip erstatter ikke kontrollens navn.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-tooltip",
        "styles": {
          "backgroundColor": "{color.background.inverse}",
          "color": "{color.text.inverse}",
          "borderRadius": "{radius.note}",
          "padding": "{space.component.paddingCompact} {space.component.padding}",
          "fontSize": "{typography.size.small}",
          "fontWeight": "{typography.weight.body}",
          "whiteSpace": "normal",
          "fontFamily": "{typography.font.body}",
          "lineHeight": "{typography.lineHeight.body}",
          "maxWidth": "28ch",
          "boxShadow": "{shadow.floating}"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Almindelig opbygning.",
        "styles": {}
      },
      "warning": {
        "description": "Et forhold kræver opmærksomhed.",
        "styles": {
          "backgroundColor": "{color.status.danger}",
          "color": "{color.status.dangerContrast}"
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "div",
      "part": "root",
      "text": "Supplerende information"
    }
  },
  "caption": {
    "name": "Billedtekst",
    "description": "En kort beskrivelse med valgfri etiket til illustration, video eller indholdsvisning.",
    "usage": "Produktet leverer beskrivelse og etiket. Temaet vælger typografi og farver; opbygningen virker på tværs af indholdstyper.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-caption",
        "styles": {
          "textAlign": "start",
          "display": "flex",
          "flexDirection": "column",
          "alignItems": "start",
          "gap": "{space.component.gap}",
          "padding": "{space.component.padding}",
          "backgroundColor": "{color.caption.surface}",
          "color": "{color.caption.text}",
          "borderRadius": "{radius.card}",
          "fontFamily": "{typography.font.body}",
          "lineHeight": "{typography.lineHeight.body}"
        }
      },
      "label": {
        "selector": ".ds-caption__label",
        "styles": {
          "display": "inline-block",
          "fontSize": "{typography.size.small}",
          "fontWeight": "{typography.weight.strong}",
          "letterSpacing": "{typography.tracking.captionLabel}",
          "textTransform": "uppercase",
          "color": "{color.caption.labelText}",
          "backgroundColor": "{color.caption.labelSurface}",
          "borderRadius": "{radius.pill}",
          "padding": "calc({space.component.paddingCompact} / 2) {space.component.paddingCompact}",
          "lineHeight": "{typography.lineHeight.control}"
        }
      },
      "text": {
        "selector": ".ds-caption__text",
        "styles": {
          "fontFamily": "{typography.font.expressive}",
          "fontStyle": "normal",
          "fontWeight": "{typography.weight.expressive}",
          "fontSize": "{typography.size.captionText}",
          "lineHeight": "{typography.lineHeight.captionText}",
          "color": "{color.caption.text}",
          "margin": "0"
        }
      }
    },
    "variants": {},
    "states": {},
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "tag": "span",
          "part": "label",
          "text": "Information"
        },
        {
          "tag": "p",
          "part": "text",
          "text": "En kort beskrivelse af indholdet."
        }
      ]
    }
  },
  "brand-mark": {
    "name": "Brandmærke",
    "description": "En godkendt originalressource for produktets identitet.",
    "usage": "Brug originalen fra brand.logos og brand.assets. Renderer bevarer proportioner. Uden original vises en neutral pladsholder; genskab ikke et eksisterende logo.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-brand-mark",
        "styles": {
          "display": "flex",
          "alignItems": "center",
          "gap": "{space.component.gap}",
          "fontFamily": "{typography.font.body}",
          "fontSize": "{typography.size.title}",
          "fontWeight": "{typography.weight.strong}",
          "letterSpacing": "{typography.tracking.brand}",
          "color": "{color.text.primary}",
          "lineHeight": "{typography.lineHeight.heading}"
        }
      },
      "symbol": {
        "selector": ".ds-brand-mark__symbol",
        "styles": {
          "width": "{size.icon.brand}",
          "height": "{size.icon.brand}"
        }
      },
      "name": {
        "selector": ".ds-brand-mark__name",
        "styles": {}
      },
      "asset": {
        "selector": ".ds-brand-mark__asset",
        "styles": {
          "display": "block",
          "maxWidth": "{size.brand.logo}",
          "width": "100%",
          "height": "auto",
          "objectFit": "contain"
        }
      }
    },
    "variants": {},
    "states": {},
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "tag": "span",
          "part": "name",
          "text": "Dit brand"
        }
      ]
    }
  },
  "scroll-area": {
    "name": "Scrollområde",
    "description": "Et afgrænset scrollområde med plads til tastaturfokus og scrollbarer inden for afrundingen.",
    "usage": "Produktet begrænser den ydre højde. Bevar viewport og content. contained ejer én samlet ramme og omslutter et card, inspector eller toolbar, hvis native root får surface-part og beholder padding og direkte anatomi. body bruges til scrollbart indhold inde i et indrammet kort med fast header. Giv viewport et tilgængeligt navn og tabindex=0 til selvstændig tastaturrulning.",
    "composes": [],
    "parts": {
      "root": {
        "selector": ".ds-scroll-area",
        "styles": {
          "display": "flex",
          "flexDirection": "column",
          "minWidth": "0",
          "minHeight": "0",
          "maxWidth": "100%",
          "boxSizing": "border-box",
          "overflow": "hidden",
          "borderRadius": "{radius.card}"
        }
      },
      "viewport": {
        "selector": ".ds-scroll-area__viewport",
        "styles": {
          "flex": "1 1 auto",
          "minWidth": "0",
          "minHeight": "0",
          "maxWidth": "100%",
          "boxSizing": "border-box",
          "margin": "{space.1}",
          "overflow": "auto",
          "overscrollBehavior": "contain",
          "scrollbarWidth": "thin",
          "scrollbarColor": "{color.border.field} transparent",
          "scrollbarGutter": "auto",
          "borderRadius": "max(0px, calc({radius.card} - {space.1}))"
        }
      },
      "content": {
        "selector": ".ds-scroll-area__content",
        "styles": {
          "minWidth": "0",
          "boxSizing": "border-box",
          "padding": "max({space.component.paddingCompact}, calc(max(3px, {border.width.focus}) + max(2px, {border.offset.focus})))"
        }
      },
      "surface": {
        "selector": ".ds-scroll-area__surface",
        "styles": {
          "border": "0",
          "borderRadius": "0",
          "backgroundColor": "transparent",
          "boxShadow": "none"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Fokusplads omkring vilkårligt indhold.",
        "styles": {}
      },
      "contained": {
        "description": "Omslutter en fælles komponent med egen indvendig afstand uden dobbelt padding.",
        "styles": {
          "backgroundColor": "{color.background.surface}",
          "border": "{border.width.default} solid {color.border.default}"
        },
        "parts": {
          "content": {
            "styles": {
              "padding": "max(0px, calc(max(3px, {border.width.focus}) + max(2px, {border.offset.focus}) - min({space.component.paddingCompact}, {space.component.padding}, {space.component.paddingLarge})))"
            }
          }
        }
      },
      "body": {
        "description": "Scrollbart indhold under en fast header i en allerede indrammet komponent.",
        "styles": {
          "border": "0",
          "borderRadius": "0",
          "backgroundColor": "transparent"
        },
        "parts": {
          "viewport": {
            "styles": {
              "margin": "0",
              "borderRadius": "0"
            }
          }
        }
      }
    },
    "states": {
      "focus": {
        "description": "Viewport kan modtage tastaturfokus og scrolles selvstændigt.",
        "styles": {},
        "parts": {
          "viewport": {
            "styles": {
              "outline": "{border.width.focus} solid {color.focus}",
              "outlineOffset": "calc(-1 * {border.width.focus})"
            }
          }
        }
      }
    },
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "tag": "div",
          "part": "viewport",
          "attrs": {
            "role": "region",
            "aria-label": "Flere oplysninger",
            "tabindex": "0"
          },
          "children": [
            {
              "tag": "div",
              "part": "content",
              "children": [
                {
                  "tag": "section",
                  "part": "surface",
                  "children": [
                    {
                      "tag": "p",
                      "text": "Relateret indhold kan scrolles i et afgrænset område."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  "tree": {
    "name": "Hierarkisk liste",
    "description": "En indlejret liste med foldning, valg og navngivne handlinger for elementer, filer eller lag.",
    "usage": "Brug mountTree til kontrollerede data og callbacks. Standard bruger 32 px rækker og tæt indrykning; roomy giver 44 px klikflader. Vis kun nødvendige metadata og få direkte rækkehandlinger. Andre operationer hører til i objektets menu eller inspektør. Piletaster flytter fokus og åbner eller lukker grene; Space vælger, Shift udvider valg, og Ctrl eller Meta skifter enkelte valg. Produktet ejer tilstand, kontekstmenu og flytning, og skal supplere træk med en klik- og tastaturbetjent Flyt-handling. Flere egentlige datakolonner kræver en særskilt treegrid.",
    "composes": ["button", "badge"],
    "parts": {
      "root": {"selector": ".ds-tree", "styles": {"display":"flex","flexDirection":"column","gap":"0","minWidth":"0","padding":"{space.component.paddingCompact}","margin":"0","listStyleType":"none","fontFamily":"{typography.font.body}","fontSize":"{typography.size.body}","lineHeight":"{typography.lineHeight.body}","color":"{color.text.primary}","backgroundColor":"{color.background.surface}","boxSizing":"border-box"}},
      "item": {"selector":".ds-tree__item","styles":{"display":"block","minWidth":"0","margin":"0","padding":"0","listStyleType":"none","borderRadius":"{radius.control}","--ds-interaction-hover-surface":"{color.action.neutralHover}","--ds-interaction-hover-text":"{color.action.neutralHoverText}","--ds-interaction-active-surface":"{color.action.neutralActive}","--ds-interaction-active-text":"{color.action.neutralActiveText}"}},
      "row": {"selector":".ds-tree__row","styles":{"display":"flex","alignItems":"center","gap":"{space.component.gap}","minHeight":"32px","minWidth":"0","borderRadius":"{radius.control}","border":"{border.width.default} solid transparent","padding":"0 {space.component.paddingCompact}","boxSizing":"border-box","color":"inherit","backgroundColor":"transparent"}},
      "group": {"selector":".ds-tree__group","styles":{"display":"flex","flexDirection":"column","gap":"0","minWidth":"0","padding":"0 0 0 {space.component.padding}","margin":"0","listStyleType":"none"}},
      "toggle": {"selector":".ds-tree__toggle","styles":{"display":"inline-flex","alignItems":"center","justifyContent":"center","minWidth":"24px","minHeight":"32px","flexShrink":"0","padding":"0","border":"0","borderRadius":"{radius.control}","fontFamily":"inherit","fontSize":"inherit","fontWeight":"inherit","lineHeight":"inherit","color":"inherit","backgroundColor":"transparent","cursor":"pointer","width":"24px"}},
      "spacer": {"selector":".ds-tree__spacer","styles":{"display":"block","width":"24px","minWidth":"24px","flexShrink":"0"}},
      "label": {"selector":".ds-tree__label","styles":{"display":"flex","alignItems":"center","gap":"{space.component.gap}","flex":"1 1 auto","minWidth":"0","minHeight":"32px","padding":"0","border":"0","borderRadius":"{radius.control}","fontFamily":"inherit","fontSize":"inherit","fontWeight":"inherit","lineHeight":"inherit","color":"inherit","backgroundColor":"transparent","textAlign":"left","whiteSpace":"normal","wordBreak":"normal","overflowWrap":"anywhere","cursor":"pointer"}},
      "icon": {"selector":".ds-tree__icon","styles":{"display":"inline-flex","alignItems":"center","justifyContent":"center","flexShrink":"0","fontSize":"{typography.size.control}"}},
      "name": {"selector":".ds-tree__name","styles":{"minWidth":"0","overflowWrap":"anywhere","overflow":"hidden","textOverflow":"ellipsis","whiteSpace":"nowrap"}},
      "meta": {"selector":".ds-tree__meta","styles":{"minWidth":"0","fontSize":"{typography.size.label}","color":"inherit","overflowWrap":"normal","whiteSpace":"nowrap","flexShrink":"0"}},
      "badge": {"selector":".ds-tree__badge","styles":{"display":"inline-flex","alignItems":"center","justifyContent":"center","padding":"{space.component.paddingCompact}","borderRadius":"{radius.pill}","fontSize":"{typography.size.label}","color":"{color.text.secondary}","backgroundColor":"{color.background.subtle}"}},
      "actions": {"selector":".ds-tree__actions","styles":{"display":"flex","alignItems":"center","flexWrap":"wrap","gap":"{space.component.gap}","flexShrink":"0"}},
      "action": {"selector":".ds-tree__action","styles":{"display":"inline-flex","alignItems":"center","justifyContent":"center","minWidth":"28px","minHeight":"28px","padding":"0","border":"{border.width.default} solid transparent","borderRadius":"{radius.control}","fontFamily":"inherit","fontSize":"inherit","fontWeight":"inherit","lineHeight":"inherit","color":"inherit","backgroundColor":"transparent","cursor":"pointer"}}
    },
    "variants": {
      "desktop": {
  "description": "Eksplicit alias til standardens kompakte 32 px betjening. Brug roomy ved touch eller behov for større mål.",
  "styles": {
    "gap": "0",
    "padding": "{space.component.paddingCompact}"
  },
  "parts": {
    "row": {
      "styles": {
        "minHeight": "32px",
        "gap": "{space.component.gap}"
      }
    },
    "group": {
      "styles": {
        "gap": "0",
        "padding": "0 0 0 {space.component.padding}"
      }
    },
    "toggle": {
      "styles": {
        "minWidth": "24px",
        "width": "24px",
        "minHeight": "32px",
        "padding": "0"
      }
    },
    "spacer": {
      "styles": {
        "width": "24px",
        "minWidth": "24px"
      }
    },
    "label": {
      "styles": {
        "minHeight": "32px",
        "padding": "0"
      }
    },
    "action": {
      "styles": {
        "minWidth": "28px",
        "minHeight": "28px",
        "padding": "0"
      }
    }
  }
},
      "default":{"description":"Kompakt hierarki med 32 px rækker, tæt indrykning og tydelige navne.","styles":{}},
      "roomy":{"description":"Større 44 px klikflader, mere luft og ombrudte navne til touch eller behov for større mål.","styles":{"gap":"{space.component.gap}"},"parts":{"row":{"styles":{"display":"flex","alignItems":"center","gap":"{space.component.gap}","minHeight":"max(44px, {size.control.height})","minWidth":"0","borderRadius":"{radius.control}","border":"{border.width.default} solid transparent","padding":"0 {space.component.paddingCompact}","boxSizing":"border-box","color":"inherit","backgroundColor":"transparent"}},"group":{"styles":{"display":"flex","flexDirection":"column","gap":"{space.component.gap}","minWidth":"0","padding":"{space.component.gap} 0 0 {space.component.paddingLarge}","margin":"0","listStyleType":"none"}},"toggle":{"styles":{"display":"inline-flex","alignItems":"center","justifyContent":"center","minWidth":"44px","minHeight":"max(44px, {size.control.height})","flexShrink":"0","padding":"{space.component.paddingCompact}","border":"0","borderRadius":"{radius.control}","fontFamily":"inherit","fontSize":"inherit","fontWeight":"inherit","lineHeight":"inherit","color":"inherit","backgroundColor":"transparent","cursor":"pointer","width":"44px"}},"spacer":{"styles":{"display":"block","width":"44px","minWidth":"44px","flexShrink":"0"}},"label":{"styles":{"display":"flex","alignItems":"center","gap":"{space.component.gap}","flex":"1 1 auto","minWidth":"0","minHeight":"max(44px, {size.control.height})","padding":"{space.component.paddingCompact}","border":"0","borderRadius":"{radius.control}","fontFamily":"inherit","fontSize":"inherit","fontWeight":"inherit","lineHeight":"inherit","color":"inherit","backgroundColor":"transparent","textAlign":"left","whiteSpace":"normal","wordBreak":"normal","overflowWrap":"anywhere","cursor":"pointer"}},"action":{"styles":{"display":"inline-flex","alignItems":"center","justifyContent":"center","minWidth":"44px","minHeight":"max(44px, {size.control.height})","padding":"{space.component.paddingCompact}","border":"{border.width.default} solid transparent","borderRadius":"{radius.control}","fontFamily":"inherit","fontSize":"inherit","fontWeight":"inherit","lineHeight":"inherit","color":"inherit","backgroundColor":"transparent","cursor":"pointer"}},"name":{"styles":{"overflow":"visible","textOverflow":"clip","whiteSpace":"normal"}},"meta":{"styles":{"whiteSpace":"normal","overflowWrap":"anywhere","flexShrink":"1"}}}},
      "compact":{"description":"Mindre indrykning mellem niveauer med samme tilgængelige klikflader.","styles":{"gap":"{space.component.gap}"},"parts":{"row":{"styles":{"gap":"{space.component.gap}"}},"group":{"styles":{"paddingInlineStart":"{space.component.padding}"}}}}
    },
    "states": {
      "selected":{"description":"Den enkelte række er valgt uafhængigt af tastaturfokus.","styles":{"--ds-interaction-hover-surface":"{color.action.selectedHover}","--ds-interaction-hover-text":"{color.action.selectedHoverText}","--ds-interaction-active-surface":"{color.action.selectedActive}","--ds-interaction-active-text":"{color.action.selectedActiveText}"},"parts":{"row":{"styles":{"color":"{color.action.primaryText}","backgroundColor":"{color.action.primary}"}}}},
      "focus":{"description":"Den fokuserede rækkes egen klikflade markeres, også ved fokus på en rækkehandling.","styles":{},"parts":{"row":{"styles":{"outline":"max(3px, {border.width.focus}) solid {color.focus}","outlineOffset":"max(2px, {border.offset.focus})"}}}},
      "expanded":{"description":"Grenens børn er synlige. Produktet ejer den kontrollerede foldetilstand.","styles":{}},
      "disabled":{"description":"Rækken kan ikke vælges eller trækkes. Foldning og native rækkehandlinger beholder deres egen tilgængelighed, så eksempelvis en låst post kan låses op.","styles":{},"parts":{"row":{"styles":{"color":"{color.text.muted}","backgroundColor":"{color.background.subtle}","cursor":"default"}}}},
      "drop-target":{"description":"Rækken er et muligt mål for indsættelse før, efter eller inde i grenen.","styles":{},"parts":{"row":{"styles":{"outline":"max(3px, {border.width.focus}) dashed {color.focus}","outlineOffset":"max(2px, {border.offset.focus})"}}}},
      "hover":{"description":"Den enkelte række under markøren.","styles":{},"parts":{"row":{"styles":{"color":"var(--ds-interaction-hover-text)","backgroundColor":"var(--ds-interaction-hover-surface)"}}}},
      "active":{"description":"Den enkelte række under aktivering.","styles":{},"parts":{"row":{"styles":{"color":"var(--ds-interaction-active-text)","backgroundColor":"var(--ds-interaction-active-surface)"}}}}
    },
    "preview": {"tag":"ul","part":"root","attrs":{"role":"tree","aria-label":"Indhold","aria-multiselectable":"true"},"children":[{"tag":"li","part":"item","attrs":{"role":"treeitem","aria-label":"Samling","aria-expanded":"true","aria-level":"1","aria-posinset":"1","aria-setsize":"1","tabindex":"0"},"children":[{"tag":"div","part":"row","children":[{"tag":"button","part":"toggle","text":"▾","attrs":{"aria-label":"Luk Samling","aria-disabled":"false","tabindex":"-1"}},{"tag":"button","part":"label","attrs":{"tabindex":"-1"},"children":[{"tag":"span","part":"icon","text":"▣","attrs":{"aria-hidden":"true"}},{"tag":"span","part":"name","text":"Samling"}]},{"tag":"span","part":"meta","text":"2 elementer"},{"tag":"span","part":"actions","children":[{"tag":"button","part":"action","text":"◉","attrs":{"aria-label":"Skjul Samling","aria-disabled":"false","aria-pressed":"true","tabindex":"0"}}]}]},{"tag":"ul","part":"group","attrs":{"role":"group"},"children":[{"tag":"li","part":"item","attrs":{"role":"treeitem","aria-label":"Dokument","aria-selected":"true","aria-level":"2","aria-posinset":"1","aria-setsize":"2","tabindex":"-1"},"children":[{"tag":"div","part":"row","children":[{"tag":"span","part":"spacer","attrs":{"aria-hidden":"true"}},{"tag":"button","part":"label","attrs":{"tabindex":"-1"},"children":[{"tag":"span","part":"icon","text":"◇","attrs":{"aria-hidden":"true"}},{"tag":"span","part":"name","text":"Dokument"}]}]}]},{"tag":"li","part":"item","attrs":{"role":"treeitem","aria-label":"Arkiv","aria-disabled":"true","aria-level":"2","aria-posinset":"2","aria-setsize":"2","tabindex":"-1"},"children":[{"tag":"div","part":"row","children":[{"tag":"span","part":"spacer","attrs":{"aria-hidden":"true"}},{"tag":"button","part":"label","text":"Arkiv","attrs":{"disabled":true,"tabindex":"-1"}}]}]}]}]}]}
  },
  "stack": {
    "name": "Stak",
    "description": "Lodret sammensætning af relateret indhold med ens afstand mellem direkte børn.",
    "usage": "Standard samler felter, noter og handlinger med gapLarge; compact samler tæt relaterede kontroller med gap. Stakken ejer ydre afstand mellem komponenter, mens felter og valggrupper bevarer indvendig afstand. Native details-root beholder block-layout; en separat disclosure-body-stak efter summary giver luft kun i åben tilstand.",
    "composes": [
      "instruction-note",
      "field",
      "button"
    ],
    "parts": {
      "root": {
        "selector": ".ds-stack",
        "styles": {
          "display": "flex",
          "flexDirection": "column",
          "minWidth": "0",
          "gap": "{space.component.gapLarge}"
        }
      }
    },
    "variants": {
      "default": {
        "description": "Standardafstand mellem afsnit, felter, noter og handlinger.",
        "styles": {}
      },
      "compact": {
        "description": "Kompakt afstand mellem tæt relaterede kontroller.",
        "styles": {
          "gap": "{space.component.gap}"
        }
      },
      "disclosure-body": {
        "description": "Indhold efter en native summary med afstand, der kun optager plads, når details er åben.",
        "styles": {
          "gap": "{space.component.gap}",
          "paddingBlockStart": "{space.component.gapLarge}"
        }
      }
    },
    "states": {},
    "preview": {
      "tag": "div",
      "part": "root",
      "children": [
        {
          "component": "instruction-note"
        },
        {
          "component": "field"
        },
        {
          "component": "button"
        }
      ]
    }
  },
  "menubar": {
  "name": "Menulinje",
  "description": "En vedvarende, kompakt indgang til programmets kommandomenuer.",
  "usage": "Brug til globale kommandoer. Produktet styrer åbne/lukke-state, pile mellem topmenuer, Home/End, Enter/Ned til menuen, Escape med fokusretur og klik udenfor. Tab forlader hele menukæden. Topmenuer er ikke arbejdsområdefaner. Vis ingen genvej uden implementeret handling.",
  "composes": [],
  "parts": {
    "root": {
      "selector": ".ds-menubar",
      "styles": {
        "display": "flex",
        "alignItems": "center",
        "gap": "{space.component.gap}",
        "padding": "{space.component.paddingCompact}",
        "margin": "0",
        "backgroundColor": "{color.background.surface}",
        "color": "{color.text.primary}",
        "fontFamily": "{typography.font.body}"
      }
    },
    "item": {
      "selector": ".ds-menubar__item",
      "styles": {
        "display": "inline-flex",
        "alignItems": "center",
        "gap": "{space.component.gap}",
        "minHeight": "32px",
        "minWidth": "32px",
        "padding": "{space.component.paddingCompact} {space.component.padding}",
        "boxSizing": "border-box",
        "border": "{border.width.default} solid transparent",
        "borderRadius": "{radius.control}",
        "fontFamily": "{typography.font.body}",
        "fontSize": "{typography.size.control}",
        "lineHeight": "{typography.lineHeight.control}",
        "fontWeight": "{typography.weight.body}",
        "color": "{color.text.primary}",
        "backgroundColor": "transparent",
        "cursor": "pointer"
      }
    }
  },
  "variants": {
    "default": {
      "description": "Vandret programmenu.",
      "styles": {}
    }
  },
  "states": {
    "focus": {
      "description": "Synligt tastaturfokus.",
      "styles": {
        "outline": "{border.width.focus} solid {color.focus}",
        "outlineOffset": "{border.offset.focus}"
      }
    },
    "expanded": {
      "description": "Den åbne topmenu bruger aria-expanded=true på udløseren.",
      "parts": {
        "item": {
          "styles": {}
        }
      },
      "styles": {}
    },
    "hover": {
      "description": "Kun det enkelte menupunkt fremhæves ved hover.",
      "styles": {},
      "parts": {
        "item": {
          "styles": {
            "backgroundColor": "{color.action.neutralHover}",
            "color": "{color.action.neutralHoverText}"
          }
        }
      }
    },
    "active": {
      "description": "Det aktiverede menupunkt.",
      "styles": {},
      "parts": {
        "item": {
          "styles": {
            "backgroundColor": "{color.action.neutralActive}",
            "color": "{color.action.neutralActiveText}"
          }
        }
      }
    }
  },
  "preview": {
    "tag": "div",
    "part": "root",
    "attrs": {
      "role": "menubar",
      "aria-label": "Programmenu"
    },
    "children": [
      {
        "tag": "button",
        "part": "item",
        "text": "Filer",
        "attrs": {
          "role": "menuitem",
          "aria-haspopup": "menu",
          "aria-expanded": "false",
          "tabindex": "0"
        }
      },
      {
        "tag": "button",
        "part": "item",
        "text": "Rediger",
        "attrs": {
          "role": "menuitem",
          "aria-haspopup": "menu",
          "aria-expanded": "false",
          "tabindex": "-1"
        }
      },
      {
        "tag": "button",
        "part": "item",
        "text": "Vis",
        "attrs": {
          "role": "menuitem",
          "aria-haspopup": "menu",
          "aria-expanded": "false",
          "tabindex": "-1"
        }
      }
    ]
  }
},
  "menu": {
  "name": "Kommandomenu",
  "description": "En afgrænset flade med kommandoer, valg og tydelige grupper.",
  "usage": "Brug samme rolle i menulinje, kontekstmenu og overflow. Produktet placerer menuen inden for vinduet og ejer fokus, Ned/Op, Home/End, typeahead, Escape og aktivering. Radio- og checkboxpunkter viser deres tilstand. Maksimalt ét underniveau; vis undermenu med højrepil og åbn med Højre/Enter. Luk den inderste menu først. Farlige handlinger placeres sidst og adskilles. En menu må ikke indeholde almindelige formularfelter; brug en popover eller dialog. Disabled-punkter kan forklares og fokuseres med pile, men kan ikke udføres.",
  "composes": [
    "menu-item"
  ],
  "parts": {
    "root": {
      "selector": ".ds-menu",
      "styles": {
        "display": "flex",
        "flexDirection": "column",
        "gap": "{space.component.gap}",
        "padding": "{space.component.paddingCompact}",
        "minWidth": "220px",
        "maxWidth": "360px",
        "boxSizing": "border-box",
        "border": "{border.width.default} solid {color.border.default}",
        "borderRadius": "{radius.card}",
        "backgroundColor": "{color.background.surface}",
        "color": "{color.text.primary}",
        "boxShadow": "{shadow.floating}",
        "fontFamily": "{typography.font.body}"
      }
    },
    "groupLabel": {
      "selector": ".ds-menu__group-label",
      "styles": {
        "padding": "{space.component.paddingCompact}",
        "fontSize": "{typography.size.small}",
        "color": "{color.text.secondary}"
      }
    },
    "separator": {
      "selector": ".ds-menu__separator",
      "styles": {
        "height": "1px",
        "margin": "{space.component.gap} 0",
        "border": "0",
        "backgroundColor": "{color.border.default}"
      }
    }
  },
  "variants": {
    "default": {
      "description": "Fælles menuoverflade.",
      "styles": {}
    }
  },
  "states": {},
  "preview": {
    "tag": "div",
    "part": "root",
    "attrs": {
      "role": "menu",
      "aria-label": "Handlinger"
    },
    "children": [
      {
        "component": "menu-item"
      },
      {
        "tag": "hr",
        "part": "separator",
        "attrs": {
          "role": "separator"
        }
      },
      {
        "component": "menu-item"
      }
    ]
  }
},
  "menu-item": {
  "name": "Menupunkt",
  "description": "En navngivet kommando med valgfrit symbol, genvej eller valgmarkør.",
  "usage": "Labelen beskriver en handling. Brug slots til label, symbol, genvej og valgmarkør. Produktet sætter role=menuitemcheckbox/menuitemradio med aria-checked ved valg, aria-haspopup og aria-expanded ved undermenu og aria-disabled ved utilgængelig handling. Slå aktivering fra ved aria-disabled; attributten gør det ikke alene. Genvejen er supplerende og må kun vises, når produktet implementerer den.",
  "composes": [],
  "parts": {
    "root": {
      "selector": ".ds-menu-item",
      "styles": {
        "display": "inline-flex",
        "alignItems": "center",
        "gap": "{space.component.gap}",
        "minHeight": "32px",
        "minWidth": "32px",
        "padding": "{space.component.paddingCompact} {space.component.padding}",
        "boxSizing": "border-box",
        "border": "{border.width.default} solid transparent",
        "borderRadius": "{radius.control}",
        "fontFamily": "{typography.font.body}",
        "fontSize": "{typography.size.control}",
        "lineHeight": "{typography.lineHeight.control}",
        "fontWeight": "{typography.weight.body}",
        "color": "{color.text.primary}",
        "backgroundColor": "transparent",
        "cursor": "pointer",
        "width": "100%",
        "textAlign": "left"
      }
    },
    "symbol": {
      "selector": ".ds-menu-item__symbol",
      "styles": {
        "display": "inline-flex",
        "width": "18px",
        "flexShrink": "0"
      }
    },
    "label": {
      "selector": ".ds-menu-item__label",
      "styles": {
        "flex": "1 1 auto",
        "minWidth": "0"
      }
    },
    "shortcut": {
      "selector": ".ds-menu-item__shortcut",
      "styles": {
        "fontSize": "{typography.size.small}",
        "color": "{color.text.secondary}",
        "whiteSpace": "nowrap"
      }
    },
    "indicator": {
      "selector": ".ds-menu-item__indicator",
      "styles": {
        "display": "inline-flex",
        "width": "18px",
        "flexShrink": "0"
      }
    }
  },
  "variants": {
    "default": {
      "description": "Almindelig kommando.",
      "styles": {}
    },
    "danger": {
      "description": "Destruktiv kommando adskilt fra øvrige handlinger.",
      "styles": {
        "color": "{color.status.dangerText}"
      }
    }
  },
  "states": {
    "hover": {
      "description": "Kontrollen under markøren.",
      "styles": {
        "backgroundColor": "{color.action.neutralHover}",
        "color": "{color.action.neutralHoverText}"
      }
    },
    "focus": {
      "description": "Synligt tastaturfokus.",
      "styles": {
        "outline": "{border.width.focus} solid {color.focus}",
        "outlineOffset": "{border.offset.focus}"
      }
    },
    "active": {
      "description": "Kontrollen aktiveres.",
      "styles": {
        "backgroundColor": "{color.action.neutralActive}",
        "color": "{color.action.neutralActiveText}"
      }
    },
    "disabled": {
      "description": "Utilgængelig handling; produktet forklarer årsagen.",
      "styles": {
        "opacity": "{opacity.disabled}",
        "cursor": "not-allowed"
      }
    }
  },
  "preview": {
    "tag": "button",
    "part": "root",
    "attrs": {
      "role": "menuitem",
      "tabindex": "-1"
    },
    "children": [
      {
        "tag": "span",
        "part": "symbol",
        "attrs": {
          "aria-hidden": "true"
        }
      },
      {
        "tag": "span",
        "part": "label",
        "text": "Åbn"
      },
      {
        "tag": "span",
        "part": "shortcut"
      },
      {
        "tag": "span",
        "part": "indicator",
        "attrs": {
          "aria-hidden": "true"
        }
      }
    ]
  }
}
});
export const canonicalComponentId=id=>Object.hasOwn(COMPONENT_ALIASES,id)?COMPONENT_ALIASES[id]:id;
export const canonicalVariantId=(id,key)=>VARIANT_ALIASES[canonicalComponentId(id)]?.[key]??key;
export const canonicalStateId=(id,key)=>STATE_ALIASES[canonicalComponentId(id)]?.[key]??key;
export const canonicalPartId=(id,key)=>PART_ALIASES[canonicalComponentId(id)]?.[key]??key;
