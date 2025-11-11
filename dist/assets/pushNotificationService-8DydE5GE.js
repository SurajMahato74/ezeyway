const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-JjaIH_pX.js","assets/index.css"])))=>i.map(i=>d[i]);
var wt=Object.defineProperty;var yt=(t,e,n)=>e in t?wt(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var O=(t,e,n)=>yt(t,typeof e!="symbol"?e+"":e,n);import{C as M,f as fe,_ as he}from"./index-JjaIH_pX.js";const It=()=>{};var pe={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pe=function(t){const e=[];let n=0;for(let r=0;r<t.length;r++){let i=t.charCodeAt(r);i<128?e[n++]=i:i<2048?(e[n++]=i>>6|192,e[n++]=i&63|128):(i&64512)===55296&&r+1<t.length&&(t.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(t.charCodeAt(++r)&1023),e[n++]=i>>18|240,e[n++]=i>>12&63|128,e[n++]=i>>6&63|128,e[n++]=i&63|128):(e[n++]=i>>12|224,e[n++]=i>>6&63|128,e[n++]=i&63|128)}return e},Et=function(t){const e=[];let n=0,r=0;for(;n<t.length;){const i=t[n++];if(i<128)e[r++]=String.fromCharCode(i);else if(i>191&&i<224){const o=t[n++];e[r++]=String.fromCharCode((i&31)<<6|o&63)}else if(i>239&&i<365){const o=t[n++],s=t[n++],c=t[n++],u=((i&7)<<18|(o&63)<<12|(s&63)<<6|c&63)-65536;e[r++]=String.fromCharCode(55296+(u>>10)),e[r++]=String.fromCharCode(56320+(u&1023))}else{const o=t[n++],s=t[n++];e[r++]=String.fromCharCode((i&15)<<12|(o&63)<<6|s&63)}}return e.join("")},Be={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(t,e){if(!Array.isArray(t))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<t.length;i+=3){const o=t[i],s=i+1<t.length,c=s?t[i+1]:0,u=i+2<t.length,a=u?t[i+2]:0,k=o>>2,T=(o&3)<<4|c>>4;let D=(c&15)<<2|a>>6,N=a&63;u||(N=64,s||(D=64)),r.push(n[k],n[T],n[D],n[N])}return r.join("")},encodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(t):this.encodeByteArray(Pe(t),e)},decodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(t):Et(this.decodeStringToByteArray(t,e))},decodeStringToByteArray(t,e){this.init_();const n=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<t.length;){const o=n[t.charAt(i++)],c=i<t.length?n[t.charAt(i)]:0;++i;const a=i<t.length?n[t.charAt(i)]:64;++i;const T=i<t.length?n[t.charAt(i)]:64;if(++i,o==null||c==null||a==null||T==null)throw new St;const D=o<<2|c>>4;if(r.push(D),a!==64){const N=c<<4&240|a>>2;if(r.push(N),T!==64){const mt=a<<6&192|T;r.push(mt)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let t=0;t<this.ENCODED_VALS.length;t++)this.byteToCharMap_[t]=this.ENCODED_VALS.charAt(t),this.charToByteMap_[this.byteToCharMap_[t]]=t,this.byteToCharMapWebSafe_[t]=this.ENCODED_VALS_WEBSAFE.charAt(t),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]]=t,t>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)]=t,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)]=t)}}};class St extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const _t=function(t){const e=Pe(t);return Be.encodeByteArray(e,!0)},Re=function(t){return _t(t).replace(/\./g,"")},Tt=function(t){try{return Be.decodeString(t,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vt(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof globalThis<"u")return globalThis;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const At=()=>vt().__FIREBASE_DEFAULTS__,Ct=()=>{if(typeof process>"u"||typeof pe>"u")return;const t=pe.__FIREBASE_DEFAULTS__;if(t)return JSON.parse(t)},kt=()=>{if(typeof document>"u")return;let t;try{t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=t&&Tt(t[1]);return e&&JSON.parse(e)},Dt=()=>{try{return It()||At()||Ct()||kt()}catch(t){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${t}`);return}},$e=()=>{var t;return(t=Dt())==null?void 0:t.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}wrapCallback(e){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(n):e(n,r))}}}function Fe(){try{return typeof indexedDB=="object"}catch{return!1}}function Le(){return new Promise((t,e)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(r),t(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{var o;e(((o=i.error)==null?void 0:o.message)||"")}}catch(n){e(n)}})}function Ot(){return!(typeof navigator>"u"||!navigator.cookieEnabled)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mt="FirebaseError";class _ extends Error{constructor(e,n,r){super(n),this.code=e,this.customData=r,this.name=Mt,Object.setPrototypeOf(this,_.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,R.prototype.create)}}class R{constructor(e,n,r){this.service=e,this.serviceName=n,this.errors=r}create(e,...n){const r=n[0]||{},i=`${this.service}/${e}`,o=this.errors[e],s=o?Pt(o,r):"Error",c=`${this.serviceName}: ${s} (${i}).`;return new _(i,c,r)}}function Pt(t,e){return t.replace(Bt,(n,r)=>{const i=e[r];return i!=null?String(i):`<${r}?>`})}const Bt=/\{\$([^}]+)}/g;function G(t,e){if(t===e)return!0;const n=Object.keys(t),r=Object.keys(e);for(const i of n){if(!r.includes(i))return!1;const o=t[i],s=e[i];if(ge(o)&&ge(s)){if(!G(o,s))return!1}else if(o!==s)return!1}for(const i of r)if(!n.includes(i))return!1;return!0}function ge(t){return t!==null&&typeof t=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ne(t){return t&&t._delegate?t._delegate:t}class m{constructor(e,n,r){this.name=e,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const w="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rt{constructor(e,n){this.name=e,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const n=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(n)){const r=new Nt;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:n});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(e){const n=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(i){if(r)return null;throw i}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Ft(e))try{this.getOrInitializeService({instanceIdentifier:w})}catch{}for(const[n,r]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(n);try{const o=this.getOrInitializeService({instanceIdentifier:i});r.resolve(o)}catch{}}}}clearInstance(e=w){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...e.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=w){return this.instances.has(e)}getOptions(e=w){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:n={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:r,options:n});for(const[o,s]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(o);r===c&&s.resolve(i)}return i}onInit(e,n){const r=this.normalizeInstanceIdentifier(n),i=this.onInitCallbacks.get(r)??new Set;i.add(e),this.onInitCallbacks.set(r,i);const o=this.instances.get(r);return o&&e(o,r),()=>{i.delete(e)}}invokeOnInitCallbacks(e,n){const r=this.onInitCallbacks.get(n);if(r)for(const i of r)try{i(e,n)}catch{}}getOrInitializeService({instanceIdentifier:e,options:n={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:$t(e),options:n}),this.instances.set(e,r),this.instancesOptions.set(e,n),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=w){return this.component?this.component.multipleInstances?e:w:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function $t(t){return t===w?void 0:t}function Ft(t){return t.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lt{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const n=this.getProvider(e.name);if(n.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);n.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const n=new Rt(e,this);return this.providers.set(e,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var d;(function(t){t[t.DEBUG=0]="DEBUG",t[t.VERBOSE=1]="VERBOSE",t[t.INFO=2]="INFO",t[t.WARN=3]="WARN",t[t.ERROR=4]="ERROR",t[t.SILENT=5]="SILENT"})(d||(d={}));const Ht={debug:d.DEBUG,verbose:d.VERBOSE,info:d.INFO,warn:d.WARN,error:d.ERROR,silent:d.SILENT},xt=d.INFO,Wt={[d.DEBUG]:"log",[d.VERBOSE]:"log",[d.INFO]:"info",[d.WARN]:"warn",[d.ERROR]:"error"},Vt=(t,e,...n)=>{if(e<t.logLevel)return;const r=new Date().toISOString(),i=Wt[e];if(i)console[i](`[${r}]  ${t.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class jt{constructor(e){this.name=e,this._logLevel=xt,this._logHandler=Vt,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in d))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?Ht[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,d.DEBUG,...e),this._logHandler(this,d.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,d.VERBOSE,...e),this._logHandler(this,d.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,d.INFO,...e),this._logHandler(this,d.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,d.WARN,...e),this._logHandler(this,d.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,d.ERROR,...e),this._logHandler(this,d.ERROR,...e)}}const zt=(t,e)=>e.some(n=>t instanceof n);let be,me;function Kt(){return be||(be=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function qt(){return me||(me=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const He=new WeakMap,Q=new WeakMap,xe=new WeakMap,H=new WeakMap,re=new WeakMap;function Ut(t){const e=new Promise((n,r)=>{const i=()=>{t.removeEventListener("success",o),t.removeEventListener("error",s)},o=()=>{n(h(t.result)),i()},s=()=>{r(t.error),i()};t.addEventListener("success",o),t.addEventListener("error",s)});return e.then(n=>{n instanceof IDBCursor&&He.set(n,t)}).catch(()=>{}),re.set(e,t),e}function Xt(t){if(Q.has(t))return;const e=new Promise((n,r)=>{const i=()=>{t.removeEventListener("complete",o),t.removeEventListener("error",s),t.removeEventListener("abort",s)},o=()=>{n(),i()},s=()=>{r(t.error||new DOMException("AbortError","AbortError")),i()};t.addEventListener("complete",o),t.addEventListener("error",s),t.addEventListener("abort",s)});Q.set(t,e)}let J={get(t,e,n){if(t instanceof IDBTransaction){if(e==="done")return Q.get(t);if(e==="objectStoreNames")return t.objectStoreNames||xe.get(t);if(e==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return h(t[e])},set(t,e,n){return t[e]=n,!0},has(t,e){return t instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in t}};function Gt(t){J=t(J)}function Qt(t){return t===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...n){const r=t.call(x(this),e,...n);return xe.set(r,e.sort?e.sort():[e]),h(r)}:qt().includes(t)?function(...e){return t.apply(x(this),e),h(He.get(this))}:function(...e){return h(t.apply(x(this),e))}}function Jt(t){return typeof t=="function"?Qt(t):(t instanceof IDBTransaction&&Xt(t),zt(t,Kt())?new Proxy(t,J):t)}function h(t){if(t instanceof IDBRequest)return Ut(t);if(H.has(t))return H.get(t);const e=Jt(t);return e!==t&&(H.set(t,e),re.set(e,t)),e}const x=t=>re.get(t);function $(t,e,{blocked:n,upgrade:r,blocking:i,terminated:o}={}){const s=indexedDB.open(t,e),c=h(s);return r&&s.addEventListener("upgradeneeded",u=>{r(h(s.result),u.oldVersion,u.newVersion,h(s.transaction),u)}),n&&s.addEventListener("blocked",u=>n(u.oldVersion,u.newVersion,u)),c.then(u=>{o&&u.addEventListener("close",()=>o()),i&&u.addEventListener("versionchange",a=>i(a.oldVersion,a.newVersion,a))}).catch(()=>{}),c}function W(t,{blocked:e}={}){const n=indexedDB.deleteDatabase(t);return e&&n.addEventListener("blocked",r=>e(r.oldVersion,r)),h(n).then(()=>{})}const Yt=["get","getKey","getAll","getAllKeys","count"],Zt=["put","add","delete","clear"],V=new Map;function we(t,e){if(!(t instanceof IDBDatabase&&!(e in t)&&typeof e=="string"))return;if(V.get(e))return V.get(e);const n=e.replace(/FromIndex$/,""),r=e!==n,i=Zt.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(i||Yt.includes(n)))return;const o=async function(s,...c){const u=this.transaction(s,i?"readwrite":"readonly");let a=u.store;return r&&(a=a.index(c.shift())),(await Promise.all([a[n](...c),i&&u.done]))[0]};return V.set(e,o),o}Gt(t=>({...t,get:(e,n,r)=>we(e,n)||t.get(e,n,r),has:(e,n)=>!!we(e,n)||t.has(e,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class en{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(tn(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function tn(t){const e=t.getComponent();return(e==null?void 0:e.type)==="VERSION"}const Y="@firebase/app",ye="0.14.4";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const p=new jt("@firebase/app"),nn="@firebase/app-compat",rn="@firebase/analytics-compat",on="@firebase/analytics",sn="@firebase/app-check-compat",an="@firebase/app-check",cn="@firebase/auth",un="@firebase/auth-compat",dn="@firebase/database",ln="@firebase/data-connect",fn="@firebase/database-compat",hn="@firebase/functions",pn="@firebase/functions-compat",gn="@firebase/installations",bn="@firebase/installations-compat",mn="@firebase/messaging",wn="@firebase/messaging-compat",yn="@firebase/performance",In="@firebase/performance-compat",En="@firebase/remote-config",Sn="@firebase/remote-config-compat",_n="@firebase/storage",Tn="@firebase/storage-compat",vn="@firebase/firestore",An="@firebase/ai",Cn="@firebase/firestore-compat",kn="firebase";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Z="[DEFAULT]",Dn={[Y]:"fire-core",[nn]:"fire-core-compat",[on]:"fire-analytics",[rn]:"fire-analytics-compat",[an]:"fire-app-check",[sn]:"fire-app-check-compat",[cn]:"fire-auth",[un]:"fire-auth-compat",[dn]:"fire-rtdb",[ln]:"fire-data-connect",[fn]:"fire-rtdb-compat",[hn]:"fire-fn",[pn]:"fire-fn-compat",[gn]:"fire-iid",[bn]:"fire-iid-compat",[mn]:"fire-fcm",[wn]:"fire-fcm-compat",[yn]:"fire-perf",[In]:"fire-perf-compat",[En]:"fire-rc",[Sn]:"fire-rc-compat",[_n]:"fire-gcs",[Tn]:"fire-gcs-compat",[vn]:"fire-fst",[Cn]:"fire-fst-compat",[An]:"fire-vertex","fire-js":"fire-js",[kn]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const P=new Map,Nn=new Map,ee=new Map;function Ie(t,e){try{t.container.addComponent(e)}catch(n){p.debug(`Component ${e.name} failed to register with FirebaseApp ${t.name}`,n)}}function I(t){const e=t.name;if(ee.has(e))return p.debug(`There were multiple attempts to register component ${e}.`),!1;ee.set(e,t);for(const n of P.values())Ie(n,t);for(const n of Nn.values())Ie(n,t);return!0}function ie(t,e){const n=t.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),t.container.getProvider(e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const On={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},g=new R("app","Firebase",On);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mn{constructor(e,n,r){this._isDeleted=!1,this._options={...e},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new m("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw g.create("app-deleted",{appName:this._name})}}function We(t,e={}){let n=t;typeof e!="object"&&(e={name:e});const r={name:Z,automaticDataCollectionEnabled:!0,...e},i=r.name;if(typeof i!="string"||!i)throw g.create("bad-app-name",{appName:String(i)});if(n||(n=$e()),!n)throw g.create("no-options");const o=P.get(i);if(o){if(G(n,o.options)&&G(r,o.config))return o;throw g.create("duplicate-app",{appName:i})}const s=new Lt(i);for(const u of ee.values())s.addComponent(u);const c=new Mn(n,r,s);return P.set(i,c),c}function Pn(t=Z){const e=P.get(t);if(!e&&t===Z&&$e())return We();if(!e)throw g.create("no-app",{appName:t});return e}function b(t,e,n){let r=Dn[t]??t;n&&(r+=`-${n}`);const i=r.match(/\s|\//),o=e.match(/\s|\//);if(i||o){const s=[`Unable to register library "${r}" with version "${e}":`];i&&s.push(`library name "${r}" contains illegal characters (whitespace or "/")`),i&&o&&s.push("and"),o&&s.push(`version name "${e}" contains illegal characters (whitespace or "/")`),p.warn(s.join(" "));return}I(new m(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bn="firebase-heartbeat-database",Rn=1,v="firebase-heartbeat-store";let j=null;function Ve(){return j||(j=$(Bn,Rn,{upgrade:(t,e)=>{switch(e){case 0:try{t.createObjectStore(v)}catch(n){console.warn(n)}}}}).catch(t=>{throw g.create("idb-open",{originalErrorMessage:t.message})})),j}async function $n(t){try{const n=(await Ve()).transaction(v),r=await n.objectStore(v).get(je(t));return await n.done,r}catch(e){if(e instanceof _)p.warn(e.message);else{const n=g.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});p.warn(n.message)}}}async function Ee(t,e){try{const r=(await Ve()).transaction(v,"readwrite");await r.objectStore(v).put(e,je(t)),await r.done}catch(n){if(n instanceof _)p.warn(n.message);else{const r=g.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});p.warn(r.message)}}}function je(t){return`${t.name}!${t.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fn=1024,Ln=30;class Hn{constructor(e){this.container=e,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new Wn(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,n;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=Se();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(s=>s.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:i}),this._heartbeatsCache.heartbeats.length>Ln){const s=Vn(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(s,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){p.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=Se(),{heartbeatsToSend:r,unsentEntries:i}=xn(this._heartbeatsCache.heartbeats),o=Re(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(n){return p.warn(n),""}}}function Se(){return new Date().toISOString().substring(0,10)}function xn(t,e=Fn){const n=[];let r=t.slice();for(const i of t){const o=n.find(s=>s.agent===i.agent);if(o){if(o.dates.push(i.date),_e(n)>e){o.dates.pop();break}}else if(n.push({agent:i.agent,dates:[i.date]}),_e(n)>e){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class Wn{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Fe()?Le().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await $n(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return Ee(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return Ee(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function _e(t){return Re(JSON.stringify({version:2,heartbeats:t})).length}function Vn(t){if(t.length===0)return-1;let e=0,n=t[0].date;for(let r=1;r<t.length;r++)t[r].date<n&&(n=t[r].date,e=r);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jn(t){I(new m("platform-logger",e=>new en(e),"PRIVATE")),I(new m("heartbeat",e=>new Hn(e),"PRIVATE")),b(Y,ye,t),b(Y,ye,"esm2020"),b("fire-js","")}jn("");const ze="@firebase/installations",oe="0.6.19";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ke=1e4,qe=`w:${oe}`,Ue="FIS_v2",zn="https://firebaseinstallations.googleapis.com/v1",Kn=60*60*1e3,qn="installations",Un="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xn={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},E=new R(qn,Un,Xn);function Xe(t){return t instanceof _&&t.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ge({projectId:t}){return`${zn}/projects/${t}/installations`}function Qe(t){return{token:t.token,requestStatus:2,expiresIn:Qn(t.expiresIn),creationTime:Date.now()}}async function Je(t,e){const r=(await e.json()).error;return E.create("request-failed",{requestName:t,serverCode:r.code,serverMessage:r.message,serverStatus:r.status})}function Ye({apiKey:t}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":t})}function Gn(t,{refreshToken:e}){const n=Ye(t);return n.append("Authorization",Jn(e)),n}async function Ze(t){const e=await t();return e.status>=500&&e.status<600?t():e}function Qn(t){return Number(t.replace("s","000"))}function Jn(t){return`${Ue} ${t}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Yn({appConfig:t,heartbeatServiceProvider:e},{fid:n}){const r=Ge(t),i=Ye(t),o=e.getImmediate({optional:!0});if(o){const a=await o.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={fid:n,authVersion:Ue,appId:t.appId,sdkVersion:qe},c={method:"POST",headers:i,body:JSON.stringify(s)},u=await Ze(()=>fetch(r,c));if(u.ok){const a=await u.json();return{fid:a.fid||n,registrationStatus:2,refreshToken:a.refreshToken,authToken:Qe(a.authToken)}}else throw await Je("Create Installation",u)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function et(t){return new Promise(e=>{setTimeout(e,t)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zn(t){return btoa(String.fromCharCode(...t)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const er=/^[cdef][\w-]{21}$/,te="";function tr(){try{const t=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(t),t[0]=112+t[0]%16;const n=nr(t);return er.test(n)?n:te}catch{return te}}function nr(t){return Zn(t).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function F(t){return`${t.appName}!${t.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tt=new Map;function nt(t,e){const n=F(t);rt(n,e),rr(n,e)}function rt(t,e){const n=tt.get(t);if(n)for(const r of n)r(e)}function rr(t,e){const n=ir();n&&n.postMessage({key:t,fid:e}),or()}let y=null;function ir(){return!y&&"BroadcastChannel"in self&&(y=new BroadcastChannel("[Firebase] FID Change"),y.onmessage=t=>{rt(t.data.key,t.data.fid)}),y}function or(){tt.size===0&&y&&(y.close(),y=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sr="firebase-installations-database",ar=1,S="firebase-installations-store";let z=null;function se(){return z||(z=$(sr,ar,{upgrade:(t,e)=>{switch(e){case 0:t.createObjectStore(S)}}})),z}async function B(t,e){const n=F(t),i=(await se()).transaction(S,"readwrite"),o=i.objectStore(S),s=await o.get(n);return await o.put(e,n),await i.done,(!s||s.fid!==e.fid)&&nt(t,e.fid),e}async function it(t){const e=F(t),r=(await se()).transaction(S,"readwrite");await r.objectStore(S).delete(e),await r.done}async function L(t,e){const n=F(t),i=(await se()).transaction(S,"readwrite"),o=i.objectStore(S),s=await o.get(n),c=e(s);return c===void 0?await o.delete(n):await o.put(c,n),await i.done,c&&(!s||s.fid!==c.fid)&&nt(t,c.fid),c}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ae(t){let e;const n=await L(t.appConfig,r=>{const i=cr(r),o=ur(t,i);return e=o.registrationPromise,o.installationEntry});return n.fid===te?{installationEntry:await e}:{installationEntry:n,registrationPromise:e}}function cr(t){const e=t||{fid:tr(),registrationStatus:0};return ot(e)}function ur(t,e){if(e.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(E.create("app-offline"));return{installationEntry:e,registrationPromise:i}}const n={fid:e.fid,registrationStatus:1,registrationTime:Date.now()},r=dr(t,n);return{installationEntry:n,registrationPromise:r}}else return e.registrationStatus===1?{installationEntry:e,registrationPromise:lr(t)}:{installationEntry:e}}async function dr(t,e){try{const n=await Yn(t,e);return B(t.appConfig,n)}catch(n){throw Xe(n)&&n.customData.serverCode===409?await it(t.appConfig):await B(t.appConfig,{fid:e.fid,registrationStatus:0}),n}}async function lr(t){let e=await Te(t.appConfig);for(;e.registrationStatus===1;)await et(100),e=await Te(t.appConfig);if(e.registrationStatus===0){const{installationEntry:n,registrationPromise:r}=await ae(t);return r||n}return e}function Te(t){return L(t,e=>{if(!e)throw E.create("installation-not-found");return ot(e)})}function ot(t){return fr(t)?{fid:t.fid,registrationStatus:0}:t}function fr(t){return t.registrationStatus===1&&t.registrationTime+Ke<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function hr({appConfig:t,heartbeatServiceProvider:e},n){const r=pr(t,n),i=Gn(t,n),o=e.getImmediate({optional:!0});if(o){const a=await o.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={installation:{sdkVersion:qe,appId:t.appId}},c={method:"POST",headers:i,body:JSON.stringify(s)},u=await Ze(()=>fetch(r,c));if(u.ok){const a=await u.json();return Qe(a)}else throw await Je("Generate Auth Token",u)}function pr(t,{fid:e}){return`${Ge(t)}/${e}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ce(t,e=!1){let n;const r=await L(t.appConfig,o=>{if(!st(o))throw E.create("not-registered");const s=o.authToken;if(!e&&mr(s))return o;if(s.requestStatus===1)return n=gr(t,e),o;{if(!navigator.onLine)throw E.create("app-offline");const c=yr(o);return n=br(t,c),c}});return n?await n:r.authToken}async function gr(t,e){let n=await ve(t.appConfig);for(;n.authToken.requestStatus===1;)await et(100),n=await ve(t.appConfig);const r=n.authToken;return r.requestStatus===0?ce(t,e):r}function ve(t){return L(t,e=>{if(!st(e))throw E.create("not-registered");const n=e.authToken;return Ir(n)?{...e,authToken:{requestStatus:0}}:e})}async function br(t,e){try{const n=await hr(t,e),r={...e,authToken:n};return await B(t.appConfig,r),n}catch(n){if(Xe(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await it(t.appConfig);else{const r={...e,authToken:{requestStatus:0}};await B(t.appConfig,r)}throw n}}function st(t){return t!==void 0&&t.registrationStatus===2}function mr(t){return t.requestStatus===2&&!wr(t)}function wr(t){const e=Date.now();return e<t.creationTime||t.creationTime+t.expiresIn<e+Kn}function yr(t){const e={requestStatus:1,requestTime:Date.now()};return{...t,authToken:e}}function Ir(t){return t.requestStatus===1&&t.requestTime+Ke<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Er(t){const e=t,{installationEntry:n,registrationPromise:r}=await ae(e);return r?r.catch(console.error):ce(e).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Sr(t,e=!1){const n=t;return await _r(n),(await ce(n,e)).token}async function _r(t){const{registrationPromise:e}=await ae(t);e&&await e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Tr(t){if(!t||!t.options)throw K("App Configuration");if(!t.name)throw K("App Name");const e=["projectId","apiKey","appId"];for(const n of e)if(!t.options[n])throw K(n);return{appName:t.name,projectId:t.options.projectId,apiKey:t.options.apiKey,appId:t.options.appId}}function K(t){return E.create("missing-app-config-values",{valueName:t})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const at="installations",vr="installations-internal",Ar=t=>{const e=t.getProvider("app").getImmediate(),n=Tr(e),r=ie(e,"heartbeat");return{app:e,appConfig:n,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},Cr=t=>{const e=t.getProvider("app").getImmediate(),n=ie(e,at).getImmediate();return{getId:()=>Er(n),getToken:i=>Sr(n,i)}};function kr(){I(new m(at,Ar,"PUBLIC")),I(new m(vr,Cr,"PRIVATE"))}kr();b(ze,oe);b(ze,oe,"esm2020");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Dr="/firebase-messaging-sw.js",Nr="/firebase-cloud-messaging-push-scope",ct="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",Or="https://fcmregistrations.googleapis.com/v1",ut="google.c.a.c_id",Mr="google.c.a.c_l",Pr="google.c.a.ts",Br="google.c.a.e",Ae=1e4;var Ce;(function(t){t[t.DATA_MESSAGE=1]="DATA_MESSAGE",t[t.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(Ce||(Ce={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var A;(function(t){t.PUSH_RECEIVED="push-received",t.NOTIFICATION_CLICKED="notification-clicked"})(A||(A={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function f(t){const e=new Uint8Array(t);return btoa(String.fromCharCode(...e)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function Rr(t){const e="=".repeat((4-t.length%4)%4),n=(t+e).replace(/\-/g,"+").replace(/_/g,"/"),r=atob(n),i=new Uint8Array(r.length);for(let o=0;o<r.length;++o)i[o]=r.charCodeAt(o);return i}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const q="fcm_token_details_db",$r=5,ke="fcm_token_object_Store";async function Fr(t){if("databases"in indexedDB&&!(await indexedDB.databases()).map(o=>o.name).includes(q))return null;let e=null;return(await $(q,$r,{upgrade:async(r,i,o,s)=>{if(i<2||!r.objectStoreNames.contains(ke))return;const c=s.objectStore(ke),u=await c.index("fcmSenderId").get(t);if(await c.clear(),!!u){if(i===2){const a=u;if(!a.auth||!a.p256dh||!a.endpoint)return;e={token:a.fcmToken,createTime:a.createTime??Date.now(),subscriptionOptions:{auth:a.auth,p256dh:a.p256dh,endpoint:a.endpoint,swScope:a.swScope,vapidKey:typeof a.vapidKey=="string"?a.vapidKey:f(a.vapidKey)}}}else if(i===3){const a=u;e={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:f(a.auth),p256dh:f(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:f(a.vapidKey)}}}else if(i===4){const a=u;e={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:f(a.auth),p256dh:f(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:f(a.vapidKey)}}}}}})).close(),await W(q),await W("fcm_vapid_details_db"),await W("undefined"),Lr(e)?e:null}function Lr(t){if(!t||!t.subscriptionOptions)return!1;const{subscriptionOptions:e}=t;return typeof t.createTime=="number"&&t.createTime>0&&typeof t.token=="string"&&t.token.length>0&&typeof e.auth=="string"&&e.auth.length>0&&typeof e.p256dh=="string"&&e.p256dh.length>0&&typeof e.endpoint=="string"&&e.endpoint.length>0&&typeof e.swScope=="string"&&e.swScope.length>0&&typeof e.vapidKey=="string"&&e.vapidKey.length>0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hr="firebase-messaging-database",xr=1,C="firebase-messaging-store";let U=null;function dt(){return U||(U=$(Hr,xr,{upgrade:(t,e)=>{switch(e){case 0:t.createObjectStore(C)}}})),U}async function Wr(t){const e=lt(t),r=await(await dt()).transaction(C).objectStore(C).get(e);if(r)return r;{const i=await Fr(t.appConfig.senderId);if(i)return await ue(t,i),i}}async function ue(t,e){const n=lt(t),i=(await dt()).transaction(C,"readwrite");return await i.objectStore(C).put(e,n),await i.done,e}function lt({appConfig:t}){return t.appId}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vr={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used."},l=new R("messaging","Messaging",Vr);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function jr(t,e){const n=await le(t),r=ft(e),i={method:"POST",headers:n,body:JSON.stringify(r)};let o;try{o=await(await fetch(de(t.appConfig),i)).json()}catch(s){throw l.create("token-subscribe-failed",{errorInfo:s==null?void 0:s.toString()})}if(o.error){const s=o.error.message;throw l.create("token-subscribe-failed",{errorInfo:s})}if(!o.token)throw l.create("token-subscribe-no-token");return o.token}async function zr(t,e){const n=await le(t),r=ft(e.subscriptionOptions),i={method:"PATCH",headers:n,body:JSON.stringify(r)};let o;try{o=await(await fetch(`${de(t.appConfig)}/${e.token}`,i)).json()}catch(s){throw l.create("token-update-failed",{errorInfo:s==null?void 0:s.toString()})}if(o.error){const s=o.error.message;throw l.create("token-update-failed",{errorInfo:s})}if(!o.token)throw l.create("token-update-no-token");return o.token}async function Kr(t,e){const r={method:"DELETE",headers:await le(t)};try{const o=await(await fetch(`${de(t.appConfig)}/${e}`,r)).json();if(o.error){const s=o.error.message;throw l.create("token-unsubscribe-failed",{errorInfo:s})}}catch(i){throw l.create("token-unsubscribe-failed",{errorInfo:i==null?void 0:i.toString()})}}function de({projectId:t}){return`${Or}/projects/${t}/registrations`}async function le({appConfig:t,installations:e}){const n=await e.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":t.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function ft({p256dh:t,auth:e,endpoint:n,vapidKey:r}){const i={web:{endpoint:n,auth:e,p256dh:t}};return r!==ct&&(i.web.applicationPubKey=r),i}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qr=7*24*60*60*1e3;async function Ur(t){const e=await Gr(t.swRegistration,t.vapidKey),n={vapidKey:t.vapidKey,swScope:t.swRegistration.scope,endpoint:e.endpoint,auth:f(e.getKey("auth")),p256dh:f(e.getKey("p256dh"))},r=await Wr(t.firebaseDependencies);if(r){if(Qr(r.subscriptionOptions,n))return Date.now()>=r.createTime+qr?Xr(t,{token:r.token,createTime:Date.now(),subscriptionOptions:n}):r.token;try{await Kr(t.firebaseDependencies,r.token)}catch(i){console.warn(i)}return De(t.firebaseDependencies,n)}else return De(t.firebaseDependencies,n)}async function Xr(t,e){try{const n=await zr(t.firebaseDependencies,e),r={...e,token:n,createTime:Date.now()};return await ue(t.firebaseDependencies,r),n}catch(n){throw n}}async function De(t,e){const r={token:await jr(t,e),createTime:Date.now(),subscriptionOptions:e};return await ue(t,r),r.token}async function Gr(t,e){const n=await t.pushManager.getSubscription();return n||t.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:Rr(e)})}function Qr(t,e){const n=e.vapidKey===t.vapidKey,r=e.endpoint===t.endpoint,i=e.auth===t.auth,o=e.p256dh===t.p256dh;return n&&r&&i&&o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ne(t){const e={from:t.from,collapseKey:t.collapse_key,messageId:t.fcmMessageId};return Jr(e,t),Yr(e,t),Zr(e,t),e}function Jr(t,e){if(!e.notification)return;t.notification={};const n=e.notification.title;n&&(t.notification.title=n);const r=e.notification.body;r&&(t.notification.body=r);const i=e.notification.image;i&&(t.notification.image=i);const o=e.notification.icon;o&&(t.notification.icon=o)}function Yr(t,e){e.data&&(t.data=e.data)}function Zr(t,e){var i,o,s,c;if(!e.fcmOptions&&!((i=e.notification)!=null&&i.click_action))return;t.fcmOptions={};const n=((o=e.fcmOptions)==null?void 0:o.link)??((s=e.notification)==null?void 0:s.click_action);n&&(t.fcmOptions.link=n);const r=(c=e.fcmOptions)==null?void 0:c.analytics_label;r&&(t.fcmOptions.analyticsLabel=r)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ei(t){return typeof t=="object"&&!!t&&ut in t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ti(t){if(!t||!t.options)throw X("App Configuration Object");if(!t.name)throw X("App Name");const e=["projectId","apiKey","appId","messagingSenderId"],{options:n}=t;for(const r of e)if(!n[r])throw X(r);return{appName:t.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function X(t){return l.create("missing-app-config-values",{valueName:t})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ni{constructor(e,n,r){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.logEvents=[],this.isLogServiceStarted=!1;const i=ti(e);this.firebaseDependencies={app:e,appConfig:i,installations:n,analyticsProvider:r}}_delete(){return Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ri(t){try{t.swRegistration=await navigator.serviceWorker.register(Dr,{scope:Nr}),t.swRegistration.update().catch(()=>{}),await ii(t.swRegistration)}catch(e){throw l.create("failed-service-worker-registration",{browserErrorMessage:e==null?void 0:e.message})}}async function ii(t){return new Promise((e,n)=>{const r=setTimeout(()=>n(new Error(`Service worker not registered after ${Ae} ms`)),Ae),i=t.installing||t.waiting;t.active?(clearTimeout(r),e()):i?i.onstatechange=o=>{var s;((s=o.target)==null?void 0:s.state)==="activated"&&(i.onstatechange=null,clearTimeout(r),e())}:(clearTimeout(r),n(new Error("No incoming service worker found.")))})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function oi(t,e){if(!e&&!t.swRegistration&&await ri(t),!(!e&&t.swRegistration)){if(!(e instanceof ServiceWorkerRegistration))throw l.create("invalid-sw-registration");t.swRegistration=e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function si(t,e){e?t.vapidKey=e:t.vapidKey||(t.vapidKey=ct)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ht(t,e){if(!navigator)throw l.create("only-available-in-window");if(Notification.permission==="default"&&await Notification.requestPermission(),Notification.permission!=="granted")throw l.create("permission-blocked");return await si(t,e==null?void 0:e.vapidKey),await oi(t,e==null?void 0:e.serviceWorkerRegistration),Ur(t)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ai(t,e,n){const r=ci(e);(await t.firebaseDependencies.analyticsProvider.get()).logEvent(r,{message_id:n[ut],message_name:n[Mr],message_time:n[Pr],message_device_time:Math.floor(Date.now()/1e3)})}function ci(t){switch(t){case A.NOTIFICATION_CLICKED:return"notification_open";case A.PUSH_RECEIVED:return"notification_foreground";default:throw new Error}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ui(t,e){const n=e.data;if(!n.isFirebaseMessaging)return;t.onMessageHandler&&n.messageType===A.PUSH_RECEIVED&&(typeof t.onMessageHandler=="function"?t.onMessageHandler(Ne(n)):t.onMessageHandler.next(Ne(n)));const r=n.data;ei(r)&&r[Br]==="1"&&await ai(t,n.messageType,r)}const Oe="@firebase/messaging",Me="0.12.23";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const di=t=>{const e=new ni(t.getProvider("app").getImmediate(),t.getProvider("installations-internal").getImmediate(),t.getProvider("analytics-internal"));return navigator.serviceWorker.addEventListener("message",n=>ui(e,n)),e},li=t=>{const e=t.getProvider("messaging").getImmediate();return{getToken:r=>ht(e,r)}};function fi(){I(new m("messaging",di,"PUBLIC")),I(new m("messaging-internal",li,"PRIVATE")),b(Oe,Me),b(Oe,Me,"esm2020")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function pt(){try{await Le()}catch{return!1}return typeof window<"u"&&Fe()&&Ot()&&"serviceWorker"in navigator&&"PushManager"in window&&"Notification"in window&&"fetch"in window&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hi(t,e){if(!navigator)throw l.create("only-available-in-window");return t.onMessageHandler=e,()=>{t.onMessageHandler=null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gt(t=Pn()){return pt().then(e=>{if(!e)throw l.create("unsupported-browser")},e=>{throw l.create("indexed-db-unsupported")}),ie(ne(t),"messaging").getImmediate()}async function pi(t,e){return t=ne(t),ht(t,e)}function gi(t,e){return t=ne(t),hi(t,e)}fi();var bi="firebase",mi="12.4.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */b(bi,mi,"app");const wi={apiKey:"AIzaSyDoi4Mmcv0a_zcfHrQClwEKCm3FK5wzNWY",authDomain:"ezeyway-2f869.firebaseapp.com",projectId:"ezeyway-2f869",storageBucket:"ezeyway-2f869.firebasestorage.app",messagingSenderId:"413898594267",appId:"1:413898594267:android:a1836521ce3ca5252d79fe"},bt=We(wi);gt(bt);class yi{constructor(){O(this,"isInitialized",!1);O(this,"messaging",null);O(this,"vapidKey","BKxX8QhZvQK9qYjVh4wQX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8QX8Q")}async initialize(){if(!this.isInitialized)try{if(console.log("🚀 Initializing Web Push Notification Service..."),M.isNativePlatform()){await fe.initialize(),await fe.sendTokenToBackend(),this.isInitialized=!0,console.log("📱 Mobile FCM Push Notification Service initialized");return}await this.initializeWebPush(),this.isInitialized=!0,console.log("🌐 Web Push Notification Service initialized")}catch(e){console.error("❌ Push notification service failed:",e)}}async initializeWebPush(){try{if(console.log("🔥 Setting up Firebase Cloud Messaging for Web..."),!await pt()){console.warn("❌ Firebase Cloud Messaging not supported in this browser");return}this.messaging=gt(bt),console.log("✅ Firebase Messaging initialized"),await this.requestWebPushPermissions(),await this.getAndRegisterWebToken(),gi(this.messaging,n=>{console.log("📨 Web Push Message received in foreground:",n),this.handleWebPushMessage(n)}),console.log("🎧 Web push message listeners set up")}catch(e){console.error("❌ Web push initialization failed:",e)}}async requestWebPushPermissions(){try{return Notification.permission==="granted"?(console.log("✅ Web push notifications already granted"),!0):Notification.permission==="denied"?(console.warn("❌ Web push notifications denied by user"),alert("❌ Push notifications blocked! Please enable notifications in browser settings for order alerts even when browser is closed."),!1):(console.log("🔐 Requesting web push notification permission..."),await Notification.requestPermission()==="granted"?(console.log("✅ Web push notifications granted!"),!0):(console.warn("❌ Web push notifications denied"),!1))}catch(e){return console.error("❌ Error requesting web push permissions:",e),!1}}async getAndRegisterWebToken(){try{if(!this.messaging)return;console.log("🔑 Getting FCM token for web push...");const e=await pi(this.messaging,{vapidKey:this.vapidKey});e?(console.log("🔥 Web FCM Token obtained:",e),await this.sendWebTokenToBackend(e)):console.warn("❌ No FCM token received")}catch(e){console.error("❌ Error getting FCM token:",e)}}async sendWebTokenToBackend(e){try{const{apiRequest:n}=await he(async()=>{const{apiRequest:i}=await import("./index-JjaIH_pX.js").then(o=>o.c);return{apiRequest:i}},__vite__mapDeps([0,1])),{response:r}=await n("/api/register-fcm-token/",{method:"POST",body:JSON.stringify({fcm_token:e,platform:"web",browser:navigator.userAgent})});r.ok?console.log("✅ Web FCM token registered with backend"):console.warn("❌ Failed to register web FCM token:",r.status)}catch(n){console.warn("❌ Error sending web FCM token:",n)}}handleWebPushMessage(e){var n,r;console.log("📨 Handling web push message:",e);try{const i=e.data||{},o=e.notification||{},s=parseInt(i.orderId||i.order_id||"0"),c=i.orderNumber||i.order_number||o.title||"Unknown",u=i.amount||"0";if(s){console.log("🎯 Web push contains order data, showing notification");const{simpleNotificationService:a}=require("./simpleNotificationService");a.showOrderNotification(c,u,s)}else if("Notification"in window&&Notification.permission==="granted"){const a=new Notification(((n=e.notification)==null?void 0:n.title)||"Notification",{body:((r=e.notification)==null?void 0:r.body)||"You have a new notification",icon:"/favicon.ico",tag:"web-push",requireInteraction:!0});a.onclick=()=>{window.focus(),a.close()}}}catch(i){console.error("❌ Error handling web push message:",i)}}async showOrderNotification(e,n,r){if(console.log("🔔 Order notification triggered:",{orderNumber:e,amount:n,orderId:r}),M.isNativePlatform()){console.log("📱 Mobile: FCM will handle notification");return}await this.triggerBackendWebPush(e,n,r)}async triggerBackendWebPush(e,n,r){try{console.log("📡 Triggering backend web push notification...");const{apiRequest:i}=await he(async()=>{const{apiRequest:s}=await import("./index-JjaIH_pX.js").then(c=>c.c);return{apiRequest:s}},__vite__mapDeps([0,1])),{response:o}=await i("/api/send-web-push-notification/",{method:"POST",body:JSON.stringify({orderId:r,orderNumber:e,amount:n,title:`🚨 New Order #${e}`,body:`Order received - ₹${n}`,icon:"/favicon.ico",badge:"/favicon.ico",data:{orderId:r.toString(),orderNumber:e,amount:n,action:"openOrder",timestamp:Date.now()}})});o.ok?console.log("✅ Backend web push notification triggered"):(console.warn("❌ Backend web push notification failed:",o.status),this.showFallbackBrowserNotification(e,n,r))}catch(i){console.warn("❌ Error triggering backend web push:",i),this.showFallbackBrowserNotification(e,n,r)}}showFallbackBrowserNotification(e,n,r){if(console.log("🔄 Showing fallback browser notification"),"Notification"in window&&Notification.permission==="granted"){const i=new Notification(`🚨 EzyWay: New Order #${e}`,{body:`₹${n} - Tap to view order`,icon:"/favicon.ico",tag:`order-${r}`,requireInteraction:!0,data:{orderId:r,orderNumber:e,amount:n}});i.onclick=()=>{window.focus(),window.dispatchEvent(new CustomEvent("showOrderModal",{detail:{orderId:r,orderNumber:e,amount:n}})),i.close()},setTimeout(()=>i.close(),3e4)}else console.warn("❌ Fallback browser notification not available")}async requestPermissions(){return M.isNativePlatform()?!0:await this.requestWebPushPermissions()}async refreshWebToken(){M.isNativePlatform()||(console.log("🔄 Refreshing web FCM token..."),await this.getAndRegisterWebToken())}}const Si=new yi;export{Si as pushNotificationService};
