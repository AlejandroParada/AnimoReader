/* Estado, frases y enlaces. No toca el DOM ni el almacenamiento.
   Enlace: #e=<versión>.<modo>-<foco>-<emociones>-<tiempo>-<necesidad>-<ánimo>
   Elección única: 0 = sin elegir, 1..n = opción en el orden de esa versión.
   Emociones y necesidad: máscara de bits, en el mismo orden.
   La versión vigente sale del catálogo. Las anteriores quedan congeladas:
   si cambia el orden o el sentido de una opción, subí SCHEMA y copiá aquí la lista vieja. */
export var SCHEMA = 2;

export var DIMENSIONS = [
{k:'modo',t:'Modo',o:[['resolver','en modo resolver'],['tiempo','en modo tiempo para algo'],['descanso','en modo descanso'],['escuchar','en modo escuchar'],['conectar','en modo conectar'],['crear','en modo crear'],['trabajar','en modo trabajar'],['jugar','en modo jugar'],['cuidar','en modo cuidar'],['planear','en modo planear'],['procesar','en modo procesar'],['silencio','en modo silencio'],['compania','en modo compañía']]},
{k:'foco',t:'Foco',o:[['problema','con el foco en un problema'],['relacion','con el foco en la relación (quiero conectar)'],['necesidad','con el foco en una necesidad (tengo ganas de algo)'],['pasatiempo','con el foco en un pasatiempo'],['aprender','con el foco en aprender algo'],['trabajo','con el foco en el trabajo'],['casa','con el foco en la casa'],['salud','con el foco en la salud'],['dinero','con el foco en el dinero'],['futuro','con el foco en el futuro'],['conversacion','con el foco en una conversación'],['cuerpo','con el foco en el cuerpo'],['proyecto','con el foco en un proyecto'],['naturaleza','con el foco en la naturaleza'],['memoria','con el foco en un recuerdo'],['entender','con el foco en entender qué pasa']]},
{k:'emo',t:'Emoción',multi:1,o:[['frus','frustración e impotencia'],['enojo','enojo o bronca'],['ans','ansiedad'],['amor','amor'],['ale','alegría o diversión'],['apa','apatía'],['des','desilusión'],['miedo','miedo'],['tristeza','tristeza'],['calma','calma'],['verguenza','vergüenza'],['culpa','culpa'],['esperanza','esperanza'],['gratitud','gratitud'],['soledad','soledad'],['ternura','ternura'],['confusion','confusión'],['incomp','incomprendido'],['voluntad','buena voluntad'],['incertidumbre','incertidumbre']]},
{k:'tiempo',t:'Percepción del tiempo',o:[['t','con tiempo disponible'],['a','con algo de tiempo'],['p','con poco tiempo'],['n','sin tiempo'],['apuro','con apuro'],['lento','con el tiempo yendo lento'],['rapido','con el tiempo yendo rápido'],['espera','esperando'],['pausa','con una pausa']]},
{k:'nec',t:'Necesidad del cuerpo',multi:1,o:[['ham','con hambre'],['ban','con ganas de ir al baño'],['sex','con deseo de intimidad'],['des','con sueño'],['sed','con sed'],['frio','con frío'],['calor','con calor'],['dolor','con dolor o molestia'],['cansancio','con cansancio'],['aire','con ganas de aire libre'],['movimiento','con ganas de moverme'],['contacto','con ganas de contacto'],['higiene','con ganas de asearme'],['energia','con poca energía'],['abrazo','con ganas de un abrazo'],['ejercicio','con ganas de hacer ejercicios'],['mindfulness','con ganas de hacer mindfulness'],['regulacion','con ganas de regulación emocional']]},
{k:'animo',t:'Estado de ánimo',o:[['b','de buen humor'],['m','de mal humor'],['neutro','de ánimo neutro'],['irritable','de ánimo irritable'],['sensible','de ánimo sensible'],['animado','de ánimo animado'],['apagado','de ánimo apagado']]}
];

var PREVIOUS = {1:[
{k:'modo',keys:['resolver','tiempo','descanso','escuchar','conectar','crear','trabajar','jugar','cuidar','planear','procesar','silencio','compania']},
{k:'foco',keys:['problema','relacion','necesidad','pasatiempo','aprender','trabajo','casa','salud','dinero','futuro','conversacion','cuerpo','proyecto','naturaleza','memoria','entender']},
{k:'emo',multi:1,keys:['frus','enojo','ans','amor','ale','apa','des','miedo','tristeza','calma','verguenza','culpa','esperanza','gratitud','soledad','ternura','confusion','incomp','voluntad']},
{k:'tiempo',keys:['t','a','p','n','apuro','lento','rapido','espera','pausa']},
{k:'nec',keys:['ham','ban','sex','des','sed','frio','calor','dolor','cansancio','aire','movimiento','contacto','higiene','energia']},
{k:'animo',keys:['b','m','neutro','irritable','sensible','animado','apagado']}
]};

var UNREADABLE = 'Este enlace no se pudo leer.';
export var SHARE_BLURB = 'Te comparto cómo estoy. Antes de abrir el enlace, imagina mi estado.';

var QUESTION_RULES = [
{when:function(st){return st.modo==='resolver'||st.foco==='problema'},text:'¿Quieres que te ayude a resolverlo o prefieres que solo te escuche?'},
{when:function(st){return st.modo==='descanso'},text:'¿Necesitas espacio o compañía tranquila?'},
{when:function(st){return st.foco==='relacion'},text:'¿Te parece si dedicamos un rato a estar juntos?'},
{when:function(st){return st.tiempo==='p'||st.tiempo==='n'},text:'¿Lo retomamos más tarde, a una hora que acordemos?'},
{when:function(st){return includes('nec',st,'ham')||includes('nec',st,'des')||includes('nec',st,'ban')},text:'¿Atendemos primero esta necesidad y después conversamos?'},
{when:function(st){return asKeys(dimension('emo'),st.emo).length>1},text:'Estoy sintiendo varias cosas a la vez. ¿Me das un momento para ordenarlas?'}
];

export function dimension(key){for(var i=0;i<DIMENSIONS.length;i++)if(DIMENSIONS[i].k===key)return DIMENSIONS[i];return null}
function keyList(dim){return dim.o.map(function(o){return o[0]})}
function labelOf(dim,key){for(var i=0;i<dim.o.length;i++)if(dim.o[i][0]===key)return dim.o[i][1]}
export function asKeys(dim,value){if(!dim||value==null||value==='')return [];
 var list=dim.multi?(Array.isArray(value)?value:[value]):[value];if(!list.length)return [];
 return keyList(dim).filter(function(k){return list.indexOf(k)>-1})}
function includes(dimKey,state,key){return asKeys(dimension(dimKey),state&&state[dimKey]).indexOf(key)>-1}
export function isOn(dim,state,key){if(dim.multi)return asKeys(dim,state&&state[dim.k]).indexOf(key)>-1;return !!(state&&state[dim.k]===key)}

export function specFor(version){
 if(version===SCHEMA)return DIMENSIONS.map(function(d){return {k:d.k,multi:d.multi?1:0,keys:keyList(d)}});
 return PREVIOUS[version]||null}
export function catalogOk(){var spec=specFor(SCHEMA);if(!spec||spec.length!==DIMENSIONS.length)return false;
 for(var i=0;i<DIMENSIONS.length;i++){if(DIMENSIONS[i].k!==spec[i].k||!!DIMENSIONS[i].multi!==!!spec[i].multi)return false;
  var seen={};for(var j=0;j<spec[i].keys.length;j++){var key=spec[i].keys[j];if(seen[key]||DIMENSIONS[i].o[j][0]!==key)return false;seen[key]=1}}
 return true}

function joinList(items){return items.length>1?items.slice(0,-1).join(', ')+' y '+items[items.length-1]:items[0]}
function phrase(dim,state){var keys=asKeys(dim,state&&state[dim.k]);if(!keys.length)return '';
 var labels=keys.map(function(key){return labelOf(dim,key)});
 return dim.k==='emo'?'sintiendo '+joinList(labels):joinList(labels)}
export function sentence(state,who){var pieces=[];DIMENSIONS.forEach(function(dim){var text=phrase(dim,state);if(text)pieces.push(text)});
 if(!pieces.length)return '';
 var lead=who==='me'?'Estoy ':who==='them'?'Está ':'Creo que estás ';
 return lead+joinList(pieces)+'.'}
export function questions(state){var found=[];QUESTION_RULES.forEach(function(rule){if(rule.when(state||{}))found.push(rule.text)});return found.slice(0,2)}
function anyKey(state,dimKey,keys){for(var i=0;i<keys.length;i++)if(includes(dimKey,state,keys[i]))return true;return false}
function seeksContact(state){return state.modo==='conectar'||state.modo==='compania'||state.modo==='cuidar'||anyKey(state,'nec',['abrazo','contacto'])||anyKey(state,'emo',['amor','ternura','esperanza','voluntad'])}
function lowMood(state){return anyKey(state,'emo',['tristeza','apa','soledad'])&&(state.animo==='apagado'||state.animo==='m')&&anyKey(state,'nec',['cansancio','energia','des'])}
function heavyCount(state){return ['tristeza','apa','soledad','culpa','verguenza','incomp'].filter(function(key){return includes('emo',state,key)}).length}
/* No diagnostica. Mira solo combinaciones del catálogo y elige el mensaje más cuidadoso. */
export function riskPattern(state){var st=state||{};
 if(lowMood(st)&&heavyCount(st)>=2&&(st.modo==='silencio'||st.modo==='descanso'||includes('emo',st,'soledad'))&&!seeksContact(st))return {id:'bajo-solo',text:'Se nota que este momento es pesado y difícil de explicar. No tienes que atravesarlo en silencio. Esto no es un diagnóstico: es una combinación que pide acompañamiento de alguien preparado. Si aparece la idea de hacerte daño o de no querer seguir, busca ayuda ahora. En Uruguay puedes llamar a la Línea de Prevención del Suicidio, 0800 0767 o *0767 desde el celular, y a la línea de apoyo emocional, 0800 1920. Son gratuitas y atienden las 24 horas.'};
 if(lowMood(st))return {id:'bajo',text:'Se nota que estás pasando un momento complejo. Pedir cercanía o ponerle palabras ya es un paso. Si este peso se queda o crece, un profesional de salud mental puede acompañarte. No tienes que poder con todo solo.'};
 if((includes('emo',st,'culpa')||includes('emo',st,'verguenza'))&&includes('emo',st,'soledad')&&(includes('emo',st,'incomp')||includes('emo',st,'tristeza'))&&(st.animo==='apagado'||st.animo==='m'||st.animo==='sensible'))return {id:'culpa',text:'La culpa, la vergüenza y la sensación de no ser comprendido se hacen más grandes en soledad. Mereces un lugar donde eso se pueda decir sin juicio. Un profesional sabe sostener este tipo de momentos.'};
 if(includes('emo',st,'ans')&&includes('emo',st,'miedo')&&(st.tiempo==='apuro'||st.tiempo==='p'||st.tiempo==='n'||st.animo==='irritable'))return {id:'angustia',text:'Hay mucha alarma junta: el cuerpo va rápido y cuesta explicar qué pasa. No estás exagerando. Si esta angustia te desborda o se repite, un profesional puede ayudarte a regularla. Mientras tanto, puedes bajar un poco el ritmo y avisarle a alguien de confianza.'};
 return null}
export function hasAny(state){return DIMENSIONS.some(function(dim){return asKeys(dim,state&&state[dim.k]).length>0})}
export function cloneState(state){var out={};DIMENSIONS.forEach(function(dim){var keys=asKeys(dim,state&&state[dim.k]);
 if(!keys.length)return;out[dim.k]=dim.multi?keys:keys[0]});return out}
export function toggle(dim,state,key){var next=cloneState(state);
 if(dim.multi){var list=asKeys(dim,next[dim.k]);var index=list.indexOf(key);if(index>-1)list.splice(index,1);else list.push(key);if(list.length)next[dim.k]=list;else delete next[dim.k]}
 else if(next[dim.k]===key)delete next[dim.k];else next[dim.k]=key;
 return next}
export function total(){var n=1;DIMENSIONS.forEach(function(dim){n*=dim.multi?Math.pow(2,dim.o.length):dim.o.length+1});return n}

export function choiceLabel(dim,state){var keys=asKeys(dim,state&&state[dim.k]);
 if(!keys.length)return null;var labels=keys.map(function(key){return labelOf(dim,key)});return dim.multi?labels.join(', '):labels[0]}
function sameChoice(dim,a,b){var left=asKeys(dim,a&&a[dim.k]).join('\n'),right=asKeys(dim,b&&b[dim.k]).join('\n');return !!(left&&right&&left===right)}
export function compareRows(real,guess){var rows=[],hit=0,tot=0;DIMENSIONS.forEach(function(dim){
 var left=choiceLabel(dim,real),right=choiceLabel(dim,guess);if(!left&&!right)return;
 var both=!!(left&&right),match=sameChoice(dim,real,guess);if(both){tot++;if(match)hit++}
 rows.push({title:dim.t,real:left,guess:right,both:both,match:match})});return {rows:rows,hit:hit,tot:tot}}

function fail(msg){return {ok:false,error:msg}}
export function encodeState(state){var spec=specFor(SCHEMA);
 return SCHEMA+'.'+spec.map(function(dim){var value=state[dim.k];
  if(dim.multi){var list=Array.isArray(value)?value:(value?[value]:[]);var bits=0;list.forEach(function(key){var i=dim.keys.indexOf(key);if(i>-1)bits+=Math.pow(2,i)});return bits}
  if(!value)return 0;var i=dim.keys.indexOf(value);return i<0?0:i+1}).join('-')}
export function decode(payload){
 if(!payload||payload.length>80)return fail(UNREADABLE);
 var dot=payload.indexOf('.');if(dot<1)return fail(UNREADABLE);
 var verText=payload.slice(0,dot),rest=payload.slice(dot+1);
 if(!/^\d+$/.test(verText))return fail(UNREADABLE);
 var ver=+verText,spec=specFor(ver);
 if(!spec)return ver>SCHEMA?fail('Este enlace es de una versión más nueva de la app. Cuando la actualices, pídele que lo comparta de nuevo.'):fail(UNREADABLE);
 var fields=rest.split('-');if(fields.length!==spec.length)return fail(UNREADABLE);
 var state={};
 for(var i=0;i<spec.length;i++){if(!/^\d+$/.test(fields[i]))return fail(UNREADABLE);
  var n=+fields[i],dim=spec[i],cur=dimension(dim.k);if(!cur)continue;
  if(dim.multi){if(n>=Math.pow(2,dim.keys.length))return fail(UNREADABLE);
   var arr=[];dim.keys.forEach(function(key,bit){if((n&Math.pow(2,bit))&&cur.o.some(function(o){return o[0]===key}))arr.push(key)});if(arr.length)state[dim.k]=arr}
  else{if(n===0)continue;if(n>dim.keys.length)return fail(UNREADABLE);
   var key=dim.keys[n-1];if(cur.o.some(function(o){return o[0]===key}))state[dim.k]=key}}
 return {ok:true,state:state}}