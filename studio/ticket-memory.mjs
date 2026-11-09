/** Browser-local directory reference only; ticket contents remain in the folder. */
export function createTicketMemory(view=globalThis){
  async function access(write,value){
    if(!view.indexedDB){if(!write||value===null)return null;throw new Error('Lokalt lager er ikke tilgængeligt.');}
    const db=await new Promise((resolve,reject)=>{
      const request=view.indexedDB.open('stade-ticket-source',1);let blocked=false;
      request.onupgradeneeded=()=>request.result.createObjectStore('settings');
      request.onsuccess=()=>{if(blocked)request.result.close();else resolve(request.result);};
      request.onerror=()=>reject(request.error);
      request.onblocked=()=>{blocked=true;reject(new Error('Browserens lokale lager er optaget.'));};
    });
    return new Promise((resolve,reject)=>{
      try{
        const transaction=db.transaction('settings',write?'readwrite':'readonly'),store=transaction.objectStore('settings');
        const request=write?(value===null?store.delete('directory'):store.put(value,'directory')):store.get('directory');
        transaction.oncomplete=()=>{db.close();resolve(write?undefined:request.result??null);};
        transaction.onabort=()=>{db.close();reject(transaction.error??request.error??new Error('Lokalt lager kunne ikke læses.'));};
      }catch(error){db.close();reject(error);}
    });
  }
  return {read:()=>access(false),write:value=>access(true,value)};
}
