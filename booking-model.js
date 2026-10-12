export const SERVICES = [
  { id:'fuerza', name:'Entrenamiento de fuerza', short:'Fuerza', description:'Construye fuerza, mejora tu técnica y supera tu siguiente reto.', trainer:'Álex · equipo demo', room:'Zona de fuerza', durations:[60], icon:'01' },
  { id:'boxeo', name:'Boxeo sin contacto', short:'Boxeo sin contacto', description:'Técnica, coordinación y energía. Toda la intensidad, sin contacto.', trainer:'Sara · equipo demo', room:'Zona de boxeo', durations:[30,60], icon:'02' },
  { id:'impacto', name:'Bajo impacto', short:'Bajo impacto', description:'Muévete a tu ritmo. Trabaja movilidad y fuerza con ejercicios de bajo impacto.', trainer:'Dani · equipo demo', room:'Zona de movimiento', durations:[30,60], icon:'03' }
];
export const KEY='invicto-reservas-demo-v1';
export function madridToday(now=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function addDays(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function dayOfWeek(date){return new Date(date+'T12:00:00Z').getUTCDay();}
export function timeInMadrid(now=new Date()){return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);}
export function pastSession(session,now=new Date()){const today=madridToday(now);return session.date<today||(session.date===today&&session.time<=timeInMadrid(now));}
export function serviceById(id){return SERVICES.find(s=>s.id===id);}
const names=['Lucía Martín','Pablo Varela','Eva López','Marcos Díaz','Clara Souto','Diego Castro'];
export function sessionsFor(date){
  const weekday=dayOfWeek(date);if(weekday===0)return [];
  const rows=weekday===6?[
    ['fuerza',60,'09:00'],['boxeo',30,'10:15'],['impacto',60,'11:00']
  ]:[
    ['fuerza',60,'07:30'],['impacto',30,'09:00'],['boxeo',30,'10:00'],['fuerza',60,'13:30'],
    ['impacto',60,'16:30'],['boxeo',60,'17:45'],['fuerza',60,'18:00'],['boxeo',30,'19:00'],['impacto',30,'19:45'],['fuerza',60,'20:00']
  ];
  const dayNumber=Math.floor(new Date(date+'T12:00:00Z').getTime()/86400000);
  return rows.map(([service,duration,time],index)=>({id:`${date}_${service}_${duration}_${time.replace(':','')}`,date,service,duration,time,capacity:6,baseCount:(dayNumber+index*3)%7}));
}
export function sessionById(id){if(typeof id!=='string')return undefined;return sessionsFor(id.slice(0,10)).find(s=>s.id===id);}
export function emptyDatabase(){return {version:1,bookings:[],seedChanges:{},holds:[],purchases:[],receipts:[]};}
export function normalizeDatabase(db){
  if(!db||db.version!==1||!Array.isArray(db.bookings))return emptyDatabase();
  return {version:1,bookings:db.bookings.filter(b=>b&&typeof b.id==='string'&&sessionById(b.sessionId)&&typeof b.name==='string'&&typeof b.email==='string'&&['confirmed','cancelled'].includes(b.status)),seedChanges:db.seedChanges&&typeof db.seedChanges==='object'?db.seedChanges:{},holds:Array.isArray(db.holds)?db.holds.filter(h=>h&&sessionById(h.sessionId)&&h.data&&Number.isFinite(Date.parse(h.expiresAt))):[],purchases:Array.isArray(db.purchases)?db.purchases:[],receipts:Array.isArray(db.receipts)?db.receipts:[]};
}
export function seedAttendees(session,db){return Array.from({length:session.baseCount},(_,i)=>{
  const id=`seed_${session.id}_${i}`;const change=db.seedChanges[id]||{};
  return {id,sessionId:session.id,name:names[i],email:`deportista${i+1}@example.test`,phone:'',kind:'socio',status:change.cancelled?'cancelled':'confirmed',attended:!!change.attended,seed:true};
});}
export function attendees(session,db){return [...seedAttendees(session,db),...db.bookings.filter(b=>b.sessionId===session.id)];}
export function activeHolds(db,sessionId,now=new Date()){return (db.holds||[]).filter(h=>h.status==='pending'&&Date.parse(h.expiresAt)>now.getTime()&&(!sessionId||h.sessionId===sessionId));}
export function available(session,db,now=new Date()){return Math.max(0,session.capacity-attendees(session,db).filter(b=>b.status==='confirmed').length-activeHolds(db,session.id,now).length);}
export function endTime(session){const [h,m]=session.time.split(':').map(Number);const total=h*60+m+session.duration;return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;}
export function createBooking(db,sessionId,data,now=new Date()){
  const session=sessionById(sessionId);
  if(!session||pastSession(session,now))throw new Error('Este horario ya no está disponible. Elige otra sesión.');
  if(available(session,db,now)===0)throw new Error('Esta sesión acaba de completarse. Elige otro horario.');
  const name=String(data.name||'').trim();const email=String(data.email||'').trim().toLowerCase();
  if(name.length<2||name.length>80||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>120)throw new Error('Revisa el nombre y el correo antes de continuar.');
  if(db.bookings.some(b=>b.sessionId===sessionId&&b.email===email&&b.status==='confirmed'))throw new Error('Ya tienes una reserva con ese correo en esta sesión. Puedes verla en Mis reservas.');
  const start=session.time;const end=endTime(session);
  if(db.bookings.some(b=>{const other=sessionById(b.sessionId);return b.status==='confirmed'&&b.email===email&&other?.date===session.date&&other.time<end&&endTime(other)>start;}))throw new Error('Ya tienes otra reserva en ese intervalo. Elige un horario que no coincida.');
  if(activeHolds(db,null,now).some(h=>{const other=sessionById(h.sessionId);return h.data.email===email&&other?.date===session.date&&other.time<end&&endTime(other)>start;}))throw new Error('Ya hay un pago pendiente para ese correo en este intervalo. Retómalo desde Mis reservas.');
  const id='INV-'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)).replace(/-/g,'').slice(0,10).toUpperCase();
  const booking={id,sessionId,name,email,phone:String(data.phone||'').trim().slice(0,30),kind:data.kind==='socio'?'socio':'prueba',status:'confirmed',attended:false,createdAt:now.toISOString(),payment:{status:data.kind==='socio'?'included':'free',amount:0}};db.bookings.push(booking);return booking;
}
export function cancelBooking(db,id){const b=db.bookings.find(b=>b.id===id);if(b){if(b.status==='cancelled')return;b.status='cancelled';b.attended=false;if(b.payment?.purchaseId){const purchase=db.purchases.find(p=>p.id===b.payment.purchaseId);if(purchase)purchase.remainingCredits=Math.min(purchase.totalCredits,purchase.remainingCredits+1);b.payment.status='credit_returned';}else if(b.payment?.status==='paid'){b.payment.status='refunded';const receipt=db.receipts.find(r=>r.id===b.payment.receiptId);if(receipt)receipt.status='refunded';}return;}db.seedChanges[id]={...db.seedChanges[id],cancelled:true,attended:false};}
export function restoreBooking(db,id,session,now=new Date()){
  if(pastSession(session,now))throw new Error('La sesión ya ha comenzado.');
  if(available(session,db,now)===0)throw new Error('Ya no quedan plazas para restaurar esta reserva.');
  const b=db.bookings.find(b=>b.id===id);
  if(b){if(b.status==='confirmed')return;if(b.payment?.status==='refunded')throw new Error('El pago se reembolsó en la demo. Usa Reservar de nuevo para realizar otro pago simulado.');const purchase=b.payment?.purchaseId?db.purchases.find(p=>p.id===b.payment.purchaseId):null;if(b.payment?.purchaseId&&(!purchase||purchase.remainingCredits<1||purchase.validUntil<session.date))throw new Error('No hay crédito válido para restaurar esta reserva.');const copy={...db,bookings:db.bookings.filter(x=>x.id!==id)};createBooking(copy,b.sessionId,b,now);if(purchase){purchase.remainingCredits--;b.payment.status='credit';}b.status='confirmed';}
  else db.seedChanges[id]={...db.seedChanges[id],cancelled:false};
}
export function markAttended(db,id){const b=db.bookings.find(b=>b.id===id);if(b)b.attended=!b.attended;else db.seedChanges[id]={...db.seedChanges[id],attended:!db.seedChanges[id]?.attended};}
export function money(cents){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(cents/100);}
export function planFor(kind,duration){const short=duration===30;const plans={prueba:{kind:'prueba',name:'Primera sesión de prueba',amount:0,credits:0},socio:{kind:'socio',name:'Usar mi bono de demo',amount:0,credits:0},sesion:{kind:'sesion',name:'Sesión individual',amount:short?800:1200,credits:0},bono:{kind:'bono',name:'Bono de 8 sesiones',amount:short?5600:8000,credits:8},mensual:{kind:'mensual',name:'Cuota mensual · 8 sesiones',amount:short?4000:6500,credits:8}};return plans[kind]||plans.prueba;}
function reference(prefix){return prefix+'-'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)).replace(/-/g,'').slice(0,10).toUpperCase();}
export function holdState(hold,now=new Date()){return hold.status==='pending'&&Date.parse(hold.expiresAt)<=now.getTime()?'expired':hold.status;}
export function startCheckout(db,sessionId,data,now=new Date()){
  const s=sessionById(sessionId);if(!s)throw new Error('Elige una sesión disponible.');const plan=planFor(data.kind,s.duration);if(plan.amount===0)throw new Error('Esta modalidad no necesita un pago.');
  // Validate the same booking constraints without confirming a booking yet.
  const temp={...db,bookings:[...db.bookings]};const validated=createBooking(temp,sessionId,data,now);
  const hold={id:reference('PAY'),sessionId,data:{name:validated.name,email:validated.email,phone:validated.phone,kind:plan.kind},plan,status:'pending',expiresAt:new Date(now.getTime()+5*60000).toISOString(),createdAt:now.toISOString(),method:'card'};
  db.holds.push(hold);return hold;
}
export function cancelCheckout(db,id){const h=db.holds.find(h=>h.id===id);if(h&&h.status!=='paid')h.status='cancelled';}
export function retryCheckout(db,id,now=new Date()){
  const h=db.holds.find(h=>h.id===id);if(!h)throw new Error('No encontramos este pago.');if(h.status==='paid')throw new Error('Este pago ya está completado.');if(holdState(h,now)==='pending')return h;
  const replacement=startCheckout({...db,holds:db.holds.filter(x=>x.id!==id)},h.sessionId,h.data,now);h.status='pending';h.expiresAt=replacement.expiresAt;delete h.failure;return h;
}
export function finishCheckout(db,id,outcome='approved',method='card',now=new Date()){
  const h=db.holds.find(h=>h.id===id);if(!h)throw new Error('No encontramos este pago.');
  if(h.status==='paid')return db.bookings.find(b=>b.id===h.bookingId);
  if(holdState(h,now)!=='pending')throw new Error('La reserva temporal ha terminado. Vuelve a intentarlo si quedan plazas.');
  if(outcome==='declined'){h.status='failed';h.failure='Pago rechazado de demostración';return null;}
  if(outcome!=='approved')throw new Error('Resultado de pago no válido.');
  const temp={...db,holds:db.holds.filter(x=>x.id!==id)};const b=createBooking(temp,h.sessionId,h.data,now);const s=sessionById(h.sessionId);
  const receipt={id:reference('REC'),bookingId:b.id,email:b.email,name:b.name,description:h.plan.name,amount:h.plan.amount,status:'paid',method:method==='wallet'?'wallet':'card',createdAt:now.toISOString()};
  let purchase;if(h.plan.credits){purchase={id:reference('BON'),email:b.email,kind:h.plan.kind,duration:s.duration,totalCredits:h.plan.credits,remainingCredits:h.plan.credits-1,validUntil:addDays(madridToday(now),h.plan.kind==='mensual'?30:90),receiptId:receipt.id};db.purchases.push(purchase);}
  b.kind=h.plan.kind;b.payment={status:purchase?'credit':'paid',amount:h.plan.amount,receiptId:receipt.id,...(purchase?{purchaseId:purchase.id}:{}),method:receipt.method};
  db.receipts.push(receipt);h.status='paid';h.bookingId=b.id;h.method=receipt.method;return b;
}
export function usablePurchases(db,email,duration,date=madridToday()){return db.purchases.filter(p=>p.email===String(email).trim().toLowerCase()&&p.duration===duration&&p.remainingCredits>0&&p.validUntil>=date);}
export function bookWithCredits(db,sessionId,data,now=new Date()){
  const s=sessionById(sessionId);if(!s)throw new Error('Elige una sesión disponible.');const purchase=usablePurchases(db,data.email,s.duration,s.date).sort((a,b)=>a.validUntil.localeCompare(b.validUntil))[0];if(!purchase)throw new Error(`No tienes un bono válido de ${s.duration} minutos para ese correo. Elige una sesión individual o compra un bono de demo.`);
  const b=createBooking(db,sessionId,{...data,kind:'socio'},now);purchase.remainingCredits--;b.payment={status:'credit',amount:0,purchaseId:purchase.id,receiptId:purchase.receiptId};return b;
}
export function paymentLabel(b){if(b.seed)return 'Bono de ejemplo';const p=b.payment;if(!p)return b.kind==='socio'?'Bono anterior':'Gratis';return {free:'Gratis',included:'Bono anterior',paid:'Pagado · Demo',credit:'Bono · Demo',credit_returned:'Crédito devuelto',refunded:'Reembolsado · Demo'}[p.status]||'Pendiente';}
function icsText(v){return String(v).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
export function calendarEvent(booking,session){
  const day=session.date.replace(/-/g,'');const start=session.time.replace(':','')+'00';const end=endTime(session).replace(':','')+'00';
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Invicto//Demo de reservas//ES','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${booking.id}@invicto-demo`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;TZID=Europe/Madrid:${day}T${start}`,`DTEND;TZID=Europe/Madrid:${day}T${end}`,`SUMMARY:${icsText('DEMO · Invicto · '+serviceById(session.service).name)}`,'LOCATION:Antonio Noche López 28 - A Coruña',`DESCRIPTION:${icsText('Reserva de demostración. No es una cita real. Referencia: '+booking.id)}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
