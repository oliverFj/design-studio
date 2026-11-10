// Retired identities now live as colours in the curated Stade themes.
const retired={
 atelier:{id:'prisme',light:'solsten',dark:'gloed'},
 'castle-studio-v2':{id:'castle-studio',light:'light',dark:'dark'},
 kyst:{id:'studio-light',light:'mineral',dark:'mineralnat'},
 'midnight-editorial':{id:'vaerk',light:'kobber',dark:'kobbernat'},
 nocturne:{id:'studio-light',light:'blomme',dark:'blommenat'}
};
export const colorChoice=(theme,value)=>Object.hasOwn(theme.modes,value)?value:theme.defaultMode;

export function restoreThemeChoice(themes,savedTheme,legacyMode,savedColors={}){
 const alias=retired[savedTheme];
 const theme=themes.find(item=>item.id===(alias?.id??savedTheme))??themes.find(item=>item.id==='fjordside')??themes[0];
 const colors={};
 if(savedColors&&typeof savedColors==='object'&&!Array.isArray(savedColors)){
  for(const item of themes)if(Object.hasOwn(savedColors,item.id)&&Object.hasOwn(item.modes,savedColors[item.id]))colors[item.id]=savedColors[item.id];
 }
 const previous=alias?.[legacyMode]??(savedTheme===theme.id?legacyMode:undefined);
 colors[theme.id]=colorChoice(theme,colors[theme.id]??previous);
 return {theme,colors};
}
