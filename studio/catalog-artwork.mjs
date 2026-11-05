// Editorial motifs communicate a role; actual component previews live in the detail panel.
const motifs = {
  button: '<i class="catalog-art-button-echo"></i><i class="catalog-art-button-face"><b></b></i><i class="catalog-art-button-contact"></i>',
  card: '<i class="catalog-art-card-back"></i><i class="catalog-art-card-front"><b></b><em></em><em></em></i>',
  accordion: '<i class="catalog-art-accordion-open"><b></b><em></em><em></em></i><i class="catalog-art-accordion-row"><b></b></i><i class="catalog-art-accordion-row"><b></b></i>',
  avatar: '<i class="catalog-art-avatar-orbit"></i><i class="catalog-art-avatar-disc"><b></b><em></em></i>',
  dialog: '<i class="catalog-art-dialog-page"><b></b><b></b><b></b></i><i class="catalog-art-dialog-halo"></i><i class="catalog-art-dialog-window"><b></b><em></em><em></em><strong></strong></i>',
  field: '<i class="catalog-art-field-label"></i><i class="catalog-art-field-box"><b></b><em></em><strong></strong></i>',
  form: '<i class="catalog-art-form"><b></b><em></em><em></em><strong></strong></i>',
  choices: '<i class="catalog-art-choice"><b></b><em></em></i><i class="catalog-art-choice"><b></b><em></em></i>',
  switch: '<i class="catalog-art-switch"><b></b></i><i class="catalog-art-switch"><b></b></i>',
  slider: '<i class="catalog-art-slider"><b></b><em></em></i><i class="catalog-art-slider-ticks"></i>',
  segments: '<i class="catalog-art-segment-paper"></i><i class="catalog-art-segments"><b></b><b></b><b></b></i>',
  calendar: '<i class="catalog-art-calendar"><b></b><em></em><em></em><em></em><em></em><em></em><em></em></i>',
  clock: '<i class="catalog-art-clock-orbit"></i><i class="catalog-art-clock"><b></b><em></em></i>',
  upload: '<i class="catalog-art-upload-paper"><b></b><b></b></i><i class="catalog-art-upload-tray"></i><i class="catalog-art-upload-arrow"></i>',
  toolbar: '<i class="catalog-art-tool-plate"><b></b><b></b><b></b><em></em></i>',
  menu: '<i class="catalog-art-menu"><b></b><em></em><em></em><em></em></i>',
  chain: '<i class="catalog-art-chain"></i><i class="catalog-art-chain"></i><i class="catalog-art-chain-line"></i>',
  path: '<i class="catalog-art-path-line"></i><i class="catalog-art-path-node"></i><i class="catalog-art-path-node"></i><i class="catalog-art-path-node"></i>',
  tree: '<i class="catalog-art-tree-stem"></i><i class="catalog-art-tree-root"></i><i class="catalog-art-tree-branch"><b></b></i><i class="catalog-art-tree-branch"><b></b></i>',
  message: '<i class="catalog-art-message-back"></i><i class="catalog-art-message"><b></b><em></em><em></em><strong></strong></i>',
  hint: '<i class="catalog-art-hint-anchor"></i><i class="catalog-art-hint"><b></b><em></em></i>',
  progress: '<i class="catalog-art-progress-orbit"></i><i class="catalog-art-progress"><b></b></i><i class="catalog-art-progress-label"></i>',
  spinner: '<i class="catalog-art-spinner-orbit"></i><i class="catalog-art-spinner"></i><i class="catalog-art-spinner-core"></i>',
  skeleton: '<i class="catalog-art-skeleton"><b></b><em></em><em></em><em></em></i>',
  empty: '<i class="catalog-art-empty-orbit"></i><i class="catalog-art-empty-sheet"><b></b></i>',
  badge: '<i class="catalog-art-status-coin"></i><i class="catalog-art-status-coin"><b></b></i><i class="catalog-art-status-coin"></i>',
  tag: '<i class="catalog-art-tag-back"></i><i class="catalog-art-tag"><b></b><em></em></i>',
  media: '<i class="catalog-art-media-back"></i><i class="catalog-art-media"><b></b><em></em><strong></strong></i><i class="catalog-art-media-caption"></i>',
  type: '<i class="catalog-art-type"><b>Aa</b><em></em><em></em><em></em><em></em></i>',
  metric: '<i class="catalog-art-metric-number">42</i><i class="catalog-art-metric-chart"><b></b><b></b><b></b></i>',
  avatars: '<i class="catalog-art-group-person"><b></b><em></em></i><i class="catalog-art-group-person"><b></b><em></em></i><i class="catalog-art-group-person"><b></b><em></em></i>',
  table: '<i class="catalog-art-table"><b></b><em></em><em></em><em></em><strong></strong></i>',
  stack: '<i class="catalog-art-stack-sheet"></i><i class="catalog-art-stack-sheet"></i><i class="catalog-art-stack-sheet"><b></b></i>',
  divider: '<i class="catalog-art-divider-disc"></i><i class="catalog-art-divider-disc"></i><i class="catalog-art-divider-line"></i>',
  scroll: '<i class="catalog-art-scroll"><b></b><em></em><em></em><em></em><em></em><em></em></i>',
  panel: '<i class="catalog-art-panel-page"><b></b></i><i class="catalog-art-panel-side"><b></b><em></em><em></em><em></em></i>',
  identity: '<i class="catalog-art-identity-paper"><b></b><em></em><strong></strong></i><i class="catalog-art-identity-seal"></i>',
  swatches: '<i class="catalog-art-swatch-sheet"></i><i class="catalog-art-swatch"></i><i class="catalog-art-swatch"></i><i class="catalog-art-swatch"></i>',
};

const roles = {
  signature:'identity', button:'button', 'action-button':'button', toolbar:'toolbar', link:'chain', menu:'menu', menubar:'toolbar', 'menu-item':'menu',
  input:'field', textarea:'field', 'number-input':'field', field:'field', 'field-group':'form', select:'field', checkbox:'choices', radio:'choices', switch:'switch', 'choice-field':'choices', 'segmented-option':'segments', 'segmented-control':'segments', 'range-field':'slider', combobox:'field', multiselect:'field', 'date-picker':'calendar', 'time-picker':'clock', 'file-upload':'upload', label:'field',
  navigation:'menu', tabs:'segments', breadcrumb:'path', pagination:'path', tree:'tree',
  alert:'message', toast:'message', spinner:'spinner', progress:'progress', skeleton:'skeleton', 'empty-state':'empty', badge:'badge', 'instruction-note':'message', tooltip:'hint',
  heading:'type', text:'type', image:'media', caption:'media', avatar:'avatar', 'avatar-group':'avatars', tag:'tag', 'metric-row':'metric', 'brand-mark':'swatches', 'data-table':'table', 'data-grid':'table',
  card:'card', stack:'stack', divider:'divider', 'scroll-area':'scroll', accordion:'accordion', inspector:'panel', dialog:'dialog', drawer:'panel', popover:'hint',
};

export const CATALOG_ARTWORK_IDS = Object.freeze(Object.keys(roles));

export function renderCatalogArtwork(id) {
  return Object.hasOwn(roles,id) ? '<span class="catalog-concept-art" data-catalog-artwork="' + id + '" aria-hidden="true">' + motifs[roles[id]] + '</span>' : '';
}
