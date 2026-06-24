import{verifyLicense as e,pingServer as t,translateText as n}from"./modules/api.js";import{initStartupOverlay as o,updateFlowStatus as s,switchMode as r,applySubModeUI as c,getImgAssetMaxSlots as i,renderRefAssetSlots as a,renderVideoAssetSlots as l,lockFrameSettings as d,unlockFrameSettings as u,updateStatus as m,updateProgress as p}from"./modules/ui.js";import{getJsonQueue as b,setJsonQueue as f,clearJsonQueue as g,addJsonTask as y,renderJsonQueue as E}from"./modules/queue.js";let h=!1,v=!1,w=!1,S=1;const I=e=>new Promise(t=>setTimeout(t,e));async function A(){for(;v&&h;)await I(500)}const k=document.getElementById("btn-start"),x=document.getElementById("btn-pause"),B=document.getElementById("btn-skip"),q=document.getElementById("btn-stop"),L=document.getElementById("prompt-list"),T=document.getElementById("prompt-count"),C=document.getElementById("use-reference"),P=document.getElementById("ref-name-box"),M=document.getElementById("ref-name"),R=document.getElementById("file-prefix"),O=document.getElementById("auto-download"),j=document.getElementById("auto-translate"),N=document.getElementById("use-end-frame"),_=document.getElementById("end-frame-name-box"),F=document.getElementById("style-prompt"),W=document.getElementById("btn-load-json"),H=document.getElementById("json-file-input"),$=document.getElementById("btn-clear-json"),D=document.getElementById("btn-paste-json"),K=document.getElementById("json-paste-box"),J=document.getElementById("json-paste-input"),V=document.getElementById("json-paste-name"),U=document.getElementById("btn-paste-add"),z=document.getElementById("btn-paste-cancel");async function G(e){
  const mode=document.querySelector("#mode-group .chip-btn.active")?.dataset.mode||"image";
  const ratio=document.querySelector("#ratio-group .chip-btn.active")?.dataset.ratio||"9:16";
  const count=document.querySelector("#count-group .chip-btn.active")?.dataset.count||"x1";
  const imgModel=document.querySelector("#img-model-group .chip-btn.active")?.dataset.imgmodel||"Nano Banana 2";
  const vidModel=document.querySelector("#model-group .chip-btn.active")?.dataset.model||"Veo 3.1 - Fast";
  const model=mode==="video"?vidModel:imgModel;
  m("⚙️ Flow 에이전트 설정 적용 중... ("+(mode==="video"?"🎬 동영상":"🖼️ 이미지")+")","info");
  const c=await chrome.scripting.executeScript({target:{tabId:e},world:"MAIN",func:async(mode,ratio,count,model)=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const clean=s=>(s||"").replace(/\s+/g," ").trim();
    const fire=el=>{el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,pointerId:1}));el.dispatchEvent(new MouseEvent("mousedown",{bubbles:true}));el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,pointerId:1}));el.dispatchEvent(new MouseEvent("mouseup",{bubbles:true}));el.dispatchEvent(new MouseEvent("click",{bubbles:true}));};
    try{
      const panelOpen=()=>[...document.querySelectorAll("h1,h2,h3,h4,div,span,p")].some(el=>{const t=clean(el.textContent);return t==="이미지 생성 기본값"||t==="동영상 생성 기본값";});
      if(!panelOpen()){
        const sb=[...document.querySelectorAll("button")].find(b=>clean(b.textContent)==="tune설정"||(b.textContent.includes("tune")&&clean(b.textContent).includes("설정")));
        if(sb){fire(sb);await sleep(900);}
      }
      if(!panelOpen())return{success:false,msg:"설정 다이얼로그를 열 수 없습니다. (Flow 작업 화면에서 실행하세요)"};
      const label=mode==="video"?"동영상 생성 기본값":"이미지 생성 기본값";
      let section=null;
      for(const el of document.querySelectorAll("*")){
        const own=clean([...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(""));
        if(own===label||clean(el.textContent).startsWith(label)){
          let p=el;
          for(let i=0;i<8&&p;i++){if(p.querySelector('[role="tab"]')){section=p;break;}p=p.parentElement;}
          if(section)break;
        }
      }
      const scope=section||document;
      const q=sel=>[...scope.querySelectorAll(sel)];
      const ratioMap={"9:16":"PORTRAIT","16:9":"LANDSCAPE","4:3":"LANDSCAPE_4_3","1:1":"SQUARE","3:4":"PORTRAIT_3_4"};
      let okR=false;const rc=ratioMap[ratio];
      if(rc){const t=q('[role="tab"][id$="-trigger-'+rc+'"]')[0];if(t){fire(t);okR=true;await sleep(400);}}
      const n=parseInt((count||"x1").replace(/\D/g,""))||1;let okC=false;
      const ct=q('[role="tab"][id$="-trigger-'+n+'"]')[0]||q('[role="tab"]').find(t=>/x/i.test(t.textContent)&&parseInt(clean(t.textContent).replace(/\D/g,""))===n);
      if(ct){fire(ct);okC=true;await sleep(400);}
      let okM=false;
      const dd=q('button[aria-haspopup="menu"]').find(b=>b.textContent.includes("arrow_drop_down"));
      if(dd){
        fire(dd);await sleep(700);
        const opt=[...document.querySelectorAll('[role="menuitem"],[role="option"]')].find(o=>clean(o.textContent).includes(model));
        if(opt){fire(opt);okM=true;await sleep(400);}
        else{document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));await sleep(200);}
      }
      let saved=false;
      const save=[...document.querySelectorAll("button")].find(b=>clean(b.textContent)==="저장");
      if(save){fire(save);saved=true;await sleep(600);}
      return{success:true,msg:"비율="+ratio+"("+(okR?"✓":"✗")+") 수량="+count+"("+(okC?"✓":"✗")+") 모델="+model+"("+(okM?"✓":"✗")+") 저장("+(saved?"✓":"✗")+")"};
    }catch(err){return{success:false,msg:"설정 적용 에러: "+err.message};}
  },args:[mode,ratio,count,model]});
  if(c&&c[0]&&c[0].result){const r2=c[0].result;if(!r2.success)return m("⚠️ "+r2.msg,"warning"),false;m("✅ Flow 설정 적용 완료: "+r2.msg,"success");}
  return await I(500),true;
}
async function Q(e,t,n){m("🎬 "+("start"===t?"시작":"종료")+" 프레임 에셋을 선택하고 있습니다... ("+n+")","info");const o=await chrome.scripting.executeScript({target:{tabId:e},world:"MAIN",func:async(e,t)=>{const n=e=>new Promise(t=>setTimeout(t,e)),o=e=>{e.dispatchEvent(new PointerEvent("pointerdown",{bubbles:!0,pointerId:1})),e.dispatchEvent(new MouseEvent("mousedown",{bubbles:!0})),e.dispatchEvent(new PointerEvent("pointerup",{bubbles:!0,pointerId:1})),e.dispatchEvent(new MouseEvent("mouseup",{bubbles:!0})),e.dispatchEvent(new MouseEvent("click",{bubbles:!0}))};try{const s="start"===e?"시작":"종료",r=Array.from(document.querySelectorAll("div, button")).find(e=>(e.textContent||"").trim()===s&&e.offsetWidth>0&&e.offsetHeight>0);if(!r)return{success:!1,msg:"'"+s+"' 버튼을 찾을 수 없습니다."};o(r),await n(1500);const c=Array.from(document.querySelectorAll("input")).find(e=>{const t=(e.placeholder||"").toLowerCase();return t.includes("애셋")||t.includes("검색")||t.includes("asset")||t.includes("search")});if(!c)return{success:!1,msg:"에셋 검색 입력창을 찾을 수 없습니다."};c.focus(),await n(300),Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set.call(c,t),c.dispatchEvent(new Event("input",{bubbles:!0})),c.dispatchEvent(new Event("change",{bubbles:!0})),c.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",keyCode:13,bubbles:!0})),await n(2e3);const i=c.closest("div[class]")?.parentElement?.parentElement;let a=!1;if(i){const e=i.querySelectorAll("img");for(const t of e)if(t.offsetWidth>20&&t.offsetWidth<100&&t.offsetHeight>20){const e=t.parentElement;if(e){o(e),a=!0,await n(1e3);break}}}if(!a){const e=Array.from(document.querySelectorAll("div, span"));for(const s of e){const e=(s.textContent||"").trim();if(e.includes(t)&&!(e.length>150)&&0!==s.offsetWidth&&s.children.length<=2&&!s.contains(c)){o(s),a=!0,await n(1e3);break}}}return{success:!0,msg:s+" 프레임 에셋 '"+t+"' "+(a?"선택 완료 ✓":"검색 완료 (수동 확인 필요)")}}catch(e){return{success:!1,msg:"에셋 선택 에러: "+e.message}}},args:[t,n]});if(o&&o[0]&&o[0].result){const e=o[0].result;return e.success?(m("✅ "+e.msg,"success"),!0):(m("⚠️ "+e.msg,"warning"),!1)}return!1}async function X(e,t){m("🔗 에셋을 추가하고 있습니다... ("+t+")","info");const n=await chrome.scripting.executeScript({target:{tabId:e},world:"MAIN",func:async e=>{const t=e=>new Promise(t=>setTimeout(t,e)),n=e=>{e.dispatchEvent(new PointerEvent("pointerdown",{bubbles:!0,pointerId:1})),e.dispatchEvent(new MouseEvent("mousedown",{bubbles:!0})),e.dispatchEvent(new PointerEvent("pointerup",{bubbles:!0,pointerId:1})),e.dispatchEvent(new MouseEvent("mouseup",{bubbles:!0})),e.dispatchEvent(new MouseEvent("click",{bubbles:!0}))};try{const o=Array.from(document.querySelectorAll('button, [role="button"]')).filter(e=>{const t=(e.textContent||"").trim();return(t.includes("add_2")||"+"===t)&&e.offsetWidth>0&&e.offsetWidth<80}).sort((e,t)=>t.getBoundingClientRect().y-e.getBoundingClientRect().y)[0];if(o)n(o);else{const e=Array.from(document.querySelectorAll("i, span")).filter(e=>{const t=(e.textContent||"").trim();return"add_2"===t||"add"===t}).sort((e,t)=>t.getBoundingClientRect().y-e.getBoundingClientRect().y)[0];if(!e)return{success:!1,msg:"에셋 추가 + 버튼을 찾을 수 없습니다."};n(e.closest("button")||e)}await t(1500);const s=Array.from(document.querySelectorAll("input")).find(e=>{const t=(e.placeholder||"").toLowerCase();return t.includes("애셋")||t.includes("검색")||t.includes("asset")||t.includes("search")});if(!s)return{success:!1,msg:"에셋 검색 입력창을 찾을 수 없습니다."};s.focus(),await t(300),Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set.call(s,e),s.dispatchEvent(new Event("input",{bubbles:!0})),s.dispatchEvent(new Event("change",{bubbles:!0})),s.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",code:"Enter",keyCode:13,bubbles:!0})),await t(2e3);let r=!1;const c=Array.from(document.querySelectorAll('[role="button"]'));for(const o of c)if((o.textContent||"").trim()===e&&o.offsetWidth>0&&o.offsetHeight>0){n(o),r=!0,await t(1e3);break}if(!r){const e=s.closest("div[class]")?.parentElement?.parentElement;if(e){const o=e.querySelectorAll("img");for(const e of o)if(e.offsetWidth>20&&e.offsetWidth<100&&e.offsetHeight>20){const o=e.parentElement;if(o){n(o),r=!0,await t(1e3);break}}}}if(!r){const o=Array.from(document.querySelectorAll("div, span"));for(const c of o)if((c.textContent||"").trim()===e&&0!==c.offsetWidth&&!c.contains(s)){n(c),r=!0,await t(1e3);break}}return{success:!0,msg:"에셋 '"+e+"' "+(r?"선택 완료 ✓":"검색 완료 (수동 확인 필요)")}}catch(e){return{success:!1,msg:"에셋 선택 에러: "+e.message}}},args:[t]});if(n&&n[0]&&n[0].result){const e=n[0].result;return e.success?(m("✅ "+e.msg,"success"),!0):(m("⚠️ "+e.msg,"warning"),!1)}return!1}o(()=>{chrome.runtime.sendMessage({type:"CHECK_FLOW_TAB"},e=>{e&&s(e.isFlow)})}),chrome.runtime.onMessage.addListener(e=>{"FLOW_TAB_STATUS"===e.type&&s(e.isFlow)}),chrome.runtime.sendMessage({type:"CHECK_FLOW_TAB"},e=>{e&&s(e.isFlow)}),document.getElementById("btn-open-flow").addEventListener("click",()=>{chrome.tabs.create({url:"https://labs.google/fx/ko/tools/flow"})}),document.querySelectorAll("#mode-group .chip-btn").forEach(e=>{e.addEventListener("click",()=>r(e.dataset.mode))}),document.querySelectorAll("#ratio-group .chip-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("#ratio-group .chip-btn").forEach(e=>e.classList.remove("active")),e.classList.add("active")})}),document.querySelectorAll("#count-group .chip-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("#count-group .chip-btn").forEach(e=>e.classList.remove("active")),e.classList.add("active")})}),document.querySelectorAll("#model-group .chip-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("#model-group .chip-btn").forEach(e=>e.classList.remove("active")),e.classList.add("active")})}),document.querySelectorAll("#submode-group .chip-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("#submode-group .chip-btn").forEach(e=>e.classList.remove("active")),e.classList.add("active"),c(),b().length>0&&E()})}),document.querySelectorAll("#img-model-group .chip-btn").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("#img-model-group .chip-btn").forEach(e=>e.classList.remove("active")),e.classList.add("active"),"image"===(document.querySelector("#mode-group .chip-btn.active")?.dataset.mode||"image")&&a()})}),C.addEventListener("change",function(){const e=document.querySelector("#mode-group .chip-btn.active")?.dataset.mode||"image",t=document.getElementById("ref-name-single"),n=document.getElementById("ref-name-multi");this.checked?(P.style.display="","image"===e?(t.style.display="none",n.style.display="",a()):(t.style.display="",n.style.display="none")):P.style.display="none"}),N&&N.addEventListener("change",()=>{_.style.display=N.checked?"":"none"}),L.addEventListener("input",()=>{const e=L.value.split("\n").filter(e=>""!==e.trim());T.innerText="프롬프트 "+e.length+"개"}),W.addEventListener("click",()=>H.click()),H.addEventListener("change",async e=>{const t=Array.from(e.target.files);if(0===t.length)return;let n=0,o=[];for(const e of t)try{const t=await e.text();JSON.parse(t),y({name:e.name,content:t,startAsset:"",endFrame:"",assets:["","",""],imgAssets:Array(10).fill("")}),n++}catch(t){o.push(`${e.name} (JSON 파싱 실패)`)}E(),n>0&&(j.checked=!1);let s=`✅ ${n}개 JSON 파일 로드 완료`;o.length>0&&(s+=`\n⚠️ 실패: ${o.join(", ")}`),alert(s),H.value=""}),$.addEventListener("click",()=>g()),D.addEventListener("click",()=>{const e="none"!==K.style.display,t=document.getElementById("main-prompt-container");e?(K.style.display="none",t&&0===b().length&&(t.style.display="")):(K.style.display="block",J.focus(),t&&(t.style.display="none"))}),z.addEventListener("click",()=>{K.style.display="none",J.value="",V.value="";const e=document.getElementById("main-prompt-container");e&&0===b().length&&(e.style.display="")}),U.addEventListener("click",()=>{const e=J.value.trim();if(!e)return void alert("⚠️ JSON 내용을 입력해 주세요.");try{JSON.parse(e)}catch(e){return void alert(`❌ JSON 형식이 올바르지 않습니다.\n\n${e.message}`)}const t=V.value.trim()||"paste_"+S++,n=t.endsWith(".json")?t:`${t}.json`;y({name:n,content:e,startAsset:"",endFrame:"",assets:["","",""],imgAssets:Array(10).fill("")}),E(),j.checked=!1,J.value="",V.value="",K.style.display="none"}),x.addEventListener("click",()=>{v=!v,x.innerText=v?"▶ 재개":"⏸ 일시정지",m(v?"⏸️ 작업이 일시정지되었습니다.":"▶️ 작업을 재개합니다.",v?"warning":"info")}),B.addEventListener("click",()=>{w=!0,m("⏭️ 현재 작업을 스킵합니다. 다음 프롬프트로 이동합니다...","warning")}),q.addEventListener("click",()=>{h=!1,v=!1,w=!1,k.disabled=!1,x.disabled=!0,B.disabled=!0,q.disabled=!0,m("🛑 작업 중지 명령이 접수되었습니다.","error")});import{runPipeline as Y}from"./modules/pipeline.js";function Z(e){return"isRunning"===e?h:"isPaused"===e?v:"isSkipped"===e?w:void 0}function ee(e,t){"isRunning"===e&&(h=t),"isPaused"===e&&(v=t),"isSkipped"===e&&(w=t)}k.addEventListener("click",async()=>{await Y({applyFlowSettings:G,selectFrameAsset:Q,selectAssetItem:X,getState:Z,setState:ee,checkPause:A,promptList:L,stylePromptInput:F,autoTranslateCheckbox:j,autoDownloadCheckbox:O,filePrefixInput:R,useReferenceCheckbox:C,refNameInput:M,btnStart:k,btnPause:x,btnSkip:B,btnStop:q,jsonPasteBox:K,jsonPasteInput:J,btnPasteAdd:U})}),(()=>{const e=document.getElementById("btn-rename-start"),t=document.getElementById("btn-rename-stop"),n=document.getElementById("rename-prefix"),o=document.getElementById("rename-progress-text"),s=document.getElementById("rename-progress-bar"),r=document.getElementById("rename-status");let c=!1;function i(e,t="info"){r.innerText=e,r.style.color={error:"#ef4444",success:"#34d399",warning:"#fbbf24"}[t]||"#888"}function a(e,t){o.innerText=e+" / "+t,s.style.width=(t>0?e/t*100:0)+"%"}e&&t&&(t.addEventListener("click",async()=>{c=!1,e.disabled=!1,t.disabled=!0,i("🛑 중지 요청됨. 현재 작업 마무리 중...","error");try{let[e]=await chrome.tabs.query({active:!0,currentWindow:!0});e&&e.url&&e.url.includes("labs.google/fx")&&await chrome.scripting.executeScript({target:{tabId:e.id},world:"MAIN",func:()=>{window.location.href.includes("/edit/")&&history.back()}})}catch(e){}i("🛑 이름 변경이 중지되었습니다.","error")}),e.addEventListener("click",async()=>{const o=n.value.trim();if(!o)return i("❌ 접두어를 입력해 주세요.","error");const s=document.getElementById("rename-total"),r=parseInt(s.value,10);if(!r||r<1)return i("❌ 총 갯수를 입력해 주세요. (예: 72)","error");let[l]=await chrome.tabs.query({active:!0,currentWindow:!0});if(!l||!l.url||!l.url.includes("labs.google/fx"))return i("❌ 현재 화면이 구글 Flow 프로젝트가 아닙니다.","error");c=!0,e.disabled=!0,t.disabled=!1;try{const e=r>=100?3:2;i("🚀 총 "+r+"개 미디어 이름 변경을 시작합니다...","success"),a(0,r),await I(1e3),i("📋 미디어 URL 수집 중... 스크롤하며 전체 목록을 파악합니다.","info");const t=await chrome.scripting.executeScript({target:{tabId:l.id},world:"MAIN",func:async e=>{const t=e=>new Promise(t=>setTimeout(t,e)),n=document.querySelectorAll("div");let o=null,s=0;for(const e of n){if(e.scrollHeight<=e.clientHeight+50||e.clientHeight<200)continue;const t=Array.from(e.querySelectorAll('div[role="button"]')).filter(e=>e.querySelector("img")||e.querySelector("video"));t.length>s&&(s=t.length,o=e)}o||(o=document.scrollingElement||document.documentElement);const r=new Map;o.scrollTop=o.scrollHeight,await t(1500);let c=0,i=0;for(let n=0;n<80;n++){const n=document.querySelectorAll('div[role="button"]');for(const e of n){const t=e.querySelector("a");if(!t||!t.href||!t.href.includes("/edit/"))continue;const n=e.getBoundingClientRect();n.width<50||r.set(t.href,{absoluteTop:n.top+o.scrollTop,left:n.left})}if(r.size>=e)break;if(r.size===c){if(i++,i>=5)break}else i=0;if(c=r.size,o.scrollTop-=.7*o.clientHeight,await t(800),o.scrollTop<=0){await t(500);const e=document.querySelectorAll('div[role="button"]');for(const t of e){const e=t.querySelector("a");if(!e||!e.href||!e.href.includes("/edit/"))continue;const n=t.getBoundingClientRect();n.width<50||r.set(e.href,{absoluteTop:n.top+o.scrollTop,left:n.left})}break}}const a=Array.from(r.entries()).map(([e,t])=>({url:e,...t})).sort((e,t)=>Math.abs(e.absoluteTop-t.absoluteTop)>30?t.absoluteTop-e.absoluteTop:t.left-e.left);return{urls:a.map(e=>e.url),collected:a.length}},args:[r]});if(!c)return void i("🛑 수집 중 중지되었습니다.","error");const n=t?.[0]?.result;if(!n||!n.urls||0===n.urls.length)return void i("❌ URL을 수집하지 못했습니다.","error");const s=n.urls,d=l.url;i("📋 "+s.length+"개 URL 수집 완료! 이름 변경 시작.","success"),await I(1e3);let u=0,m=0;for(let t=0;t<Math.min(s.length,r)&&c;t++){const n=t+1,d=o+String(n).padStart(e,"0");if(i("🔄 ["+n+"/"+r+"] "+d+" 처리 중...","info"),await chrome.tabs.update(l.id,{url:s[t]}),await I(3e3),!c)break;const p=await chrome.scripting.executeScript({target:{tabId:l.id},world:"MAIN",func:async(e,t)=>{const n=e=>new Promise(t=>setTimeout(t,e));let o=null;for(let e=0;e<20&&(o=document.querySelector("input[aria-label='수정 가능한 텍스트']"),!o);e++)await n(500);if(!o)return{error:"no_input"};const s=o.value||o.getAttribute("value")||"";if(new RegExp("^"+t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\d+$").test(s))return{skipped:!0,currentTitle:s};const r={bubbles:!0,cancelable:!0,view:window,pointerId:1,pointerType:"mouse",isPrimary:!0},c={bubbles:!0,cancelable:!0,view:window};o.dispatchEvent(new PointerEvent("pointerdown",r)),o.dispatchEvent(new MouseEvent("mousedown",c)),o.dispatchEvent(new PointerEvent("pointerup",r)),o.dispatchEvent(new MouseEvent("mouseup",c)),o.click(),o.parentElement&&o.parentElement.click(),o.focus(),o.dispatchEvent(new FocusEvent("focus",{bubbles:!0})),o.dispatchEvent(new FocusEvent("focusin",{bubbles:!0})),await n(1500),o.select(),o.setSelectionRange(0,o.value.length),await n(800);let i=!1;try{i=document.execCommand("insertText",!1,e)}catch(e){}if(!i||o.value!==e)try{const t=document.createEvent("TextEvent");t.initTextEvent("textInput",!0,!0,window,e,9,"ko-KR"),o.dispatchEvent(t)}catch(e){}if(o.value!==e){const t=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;t?t.call(o,e):o.value=e}o.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})),o.dispatchEvent(new Event("change",{bubbles:!0,composed:!0})),await n(1e3);const a={key:"Enter",code:"Enter",keyCode:13,which:13,bubbles:!0,composed:!0,cancelable:!0};o.dispatchEvent(new KeyboardEvent("keydown",a)),o.dispatchEvent(new KeyboardEvent("keypress",a)),o.dispatchEvent(new KeyboardEvent("keyup",a)),await n(1e3);const l=document.querySelectorAll("button");for(const e of l)if(e.textContent.includes("done")||e.textContent.includes("완료")||e.innerHTML.includes("done")){const t=e.getBoundingClientRect(),s=o.getBoundingClientRect();if(Math.abs(t.top-s.top)<60){e.click(),await n(500);break}}return o.blur(),await n(1e3),{renamed:!0,from:s,to:e}},args:[d,o]});if(!c)break;const b=p?.[0]?.result;"no_input"!==b?.error?(b?.skipped?(m++,i("⏭ ["+n+"/"+r+'] "'+b.currentTitle+'" 이미 변환됨',"warning")):b?.renamed&&(u++,i("✅ ["+n+"/"+r+'] "'+b.from+'" → "'+b.to+'"',"success")),a(n,r),await I(500)):(i("⚠️ ["+n+"] 입력 필드 없음. 재시도...","warning"),t--,await I(2e3))}d&&await chrome.tabs.update(l.id,{url:d}),c&&(i("🎉 완료! "+u+"개 변경, "+m+"개 건너뜀 (총 "+r+"개)","success"),a(r,r))}catch(e){i("❌ 오류: "+e.message,"error")}finally{c=!1,e.disabled=!1,t.disabled=!0}}))})();
// ── Art Studio 웹앱 연동: 받은 프롬프트/설정 자동 입력 ──
(function () {
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el == null || val == null) return;
    el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function clickChip(selector) {
    const el = document.querySelector(selector);
    if (el && !el.disabled && el.offsetParent !== null) el.click();
  }
  function applyInbox(box) {
    if (!box || !Array.isArray(box.prompts)) return;
    // 프롬프트 / 스타일
    setVal("prompt-list", box.prompts.join("\n"));
    if (box.stylePrompt) setVal("style-prompt", box.stylePrompt);
    // Flow 설정 (해당 칩 클릭)
    if (box.mode) clickChip(`[data-mode="${box.mode}"]`);
    if (box.submode) clickChip(`[data-submode="${box.submode}"]`);
    if (box.ratio) clickChip(`[data-ratio="${box.ratio}"]`);
    if (box.count) clickChip(`[data-count="${box.count}"]`);
    if (box.model) {
      clickChip(`[data-imgmodel="${box.model}"]`);
      clickChip(`[data-model="${box.model}"]`);
    }
    // 번역
    const at = document.getElementById("auto-translate");
    if (at && typeof box.autoTranslate === "boolean" && at.checked !== box.autoTranslate) at.click();
    if (box.translateTarget) setVal("translate-target", box.translateTarget);
    // 파일명
    if (box.filePrefix) setVal("file-prefix", box.filePrefix);
    // 생성시간
    if (box.delay) {
      if (box.delay.min != null) setVal("delay-min", box.delay.min);
      if (box.delay.max != null) setVal("delay-max", box.delay.max);
    }
  }
  try {
    chrome.storage.local.get("artStudioInbox", (r) => {
      if (r && r.artStudioInbox) {
        applyInbox(r.artStudioInbox);
        chrome.storage.local.remove("artStudioInbox");
      }
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.artStudioInbox && changes.artStudioInbox.newValue) {
        applyInbox(changes.artStudioInbox.newValue);
        chrome.storage.local.remove("artStudioInbox");
      }
    });
  } catch (e) {}
})();

// ── 보안 인증 자동 통과: 알려진 비밀번호 자동 입력·제출 ──
(function () {
  var PW = "artstudio"; // Supabase ART_STUDIO_LICENSE 와 동일하게 설정
  var done = false;
  function tryAuth() {
    if (done) return;
    var login = document.getElementById("startup-login");
    var input = document.getElementById("auth-password");
    var btn = document.getElementById("btn-auth-submit");
    if (!login || !input || !btn) return;
    var visible = login.offsetParent !== null || getComputedStyle(login).display !== "none";
    if (!visible) return; // 인증 오버레이가 실제로 보일 때만
    done = true;
    input.value = PW;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    btn.click();
  }
  try {
    new MutationObserver(tryAuth).observe(document.documentElement, {
      attributes: true, childList: true, subtree: true,
    });
    var n = 0;
    var iv = setInterval(function () { tryAuth(); if (done || ++n > 40) clearInterval(iv); }, 300);
    document.addEventListener("DOMContentLoaded", tryAuth);
  } catch (e) {}
})();

// ── 구 브랜드 파일명 접두어 방어: 옛 값(AiCrafter 등)이 보이면 ArtStudio_ 로 교정 ──
(function () {
  function fixPrefix() {
    var fp = document.getElementById("file-prefix");
    if (fp && /AiCrafter|Ai ?Crafter|크래프트|크래프터|크레프트|크레프터/i.test(fp.value)) {
      fp.value = "ArtStudio_";
      fp.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  document.addEventListener("DOMContentLoaded", fixPrefix);
  setTimeout(fixPrefix, 500);
})();

// ── PayApp 도네이트 자동 오픈 차단 ──
// (난독화된 startup/coffee 흐름이 payapp 결제/후원 페이지를 열려는 호출을 무력화)
(function () {
  var isDonate = function (u) {
    return typeof u === "string" && /payapp|pay-app|donat/i.test(u);
  };
  try {
    var _open = window.open;
    window.open = function (u) {
      if (isDonate(u)) { console.log("[ArtStudio] 도네이트 오픈 차단:", u); return null; }
      return _open.apply(window, arguments);
    };
  } catch (e) {}
  try {
    if (window.chrome && chrome.tabs && chrome.tabs.create) {
      var _create = chrome.tabs.create;
      chrome.tabs.create = function (o) {
        if (o && isDonate(o.url)) { console.log("[ArtStudio] 도네이트 탭 차단:", o.url); return; }
        return _create.apply(chrome.tabs, arguments);
      };
    }
  } catch (e) {}
})();
