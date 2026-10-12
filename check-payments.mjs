import assert from 'node:assert/strict';
import {emptyDatabase,normalizeDatabase,sessionsFor,available,attendees,cancelBooking,restoreBooking,startCheckout,finishCheckout,retryCheckout,cancelCheckout,holdState,activeHolds,bookWithCredits,usablePurchases} from './booking-model.js';
const now=new Date('2026-10-13T06:00:00Z');const late=new Date(now.getTime()+6*60000);const session=sessionsFor('2026-10-14').find(s=>s.service==='fuerza'&&s.baseCount<5);const data={name:'Alex Pago',email:'pago@example.com',kind:'sesion'};
const db=emptyDatabase();const initial=available(session,db,now);const hold=startCheckout(db,session.id,data,now);
assert.equal(available(session,db,now),initial-1);assert.equal(db.bookings.length,0);assert.equal(activeHolds(db,session.id,now).length,1);
assert.throws(()=>startCheckout(db,session.id,data,now),/pago pendiente/);
const paid=finishCheckout(db,hold.id,'approved','wallet',now);assert.equal(paid.status,'confirmed');assert.equal(paid.payment.status,'paid');assert.equal(paid.payment.method,'wallet');assert.equal(available(session,db,now),initial-1);assert.equal(db.receipts.length,1);
assert.equal(finishCheckout(db,hold.id,'approved','card',now).id,paid.id);assert.equal(db.bookings.length,1);assert.equal(db.receipts.length,1);
cancelBooking(db,paid.id);cancelBooking(db,paid.id);assert.equal(available(session,db,now),initial);assert.equal(paid.payment.status,'refunded');assert.equal(db.receipts[0].status,'refunded');assert.throws(()=>restoreBooking(db,paid.id,session,now),/otro pago/);
const reject=startCheckout(db,session.id,{...data,email:'rechazo@example.com'},now);assert.equal(finishCheckout(db,reject.id,'declined','card',now),null);assert.equal(available(session,db,now),initial);assert.equal(db.receipts.length,1);
retryCheckout(db,reject.id,now);assert.equal(available(session,db,now),initial-1);cancelCheckout(db,reject.id);assert.equal(available(session,db,now),initial);
const expire=startCheckout(db,session.id,{...data,email:'caducado@example.com'},now);assert.equal(holdState(expire,late),'expired');assert.equal(available(session,db,late),initial);assert.throws(()=>finishCheckout(db,expire.id,'approved','card',late),/temporal/);
const bonus=startCheckout(db,session.id,{...data,email:'bono@example.com',kind:'bono'},now);const bonusBooking=finishCheckout(db,bonus.id,'approved','card',now);assert.equal(bonusBooking.payment.status,'credit');assert.equal(db.purchases[0].remainingCredits,7);assert.equal(db.receipts.length,2);
const nextSession=sessionsFor('2026-10-15').find(s=>s.service==='fuerza'&&s.baseCount<6);const included=bookWithCredits(db,nextSession.id,{...data,email:'bono@example.com'},now);assert.equal(db.purchases[0].remainingCredits,6);assert.equal(db.receipts.length,2);
cancelBooking(db,included.id);cancelBooking(db,included.id);assert.equal(db.purchases[0].remainingCredits,7);restoreBooking(db,included.id,nextSession,now);assert.equal(db.purchases[0].remainingCredits,6);
assert.throws(()=>bookWithCredits(db,nextSession.id,{...data,email:'sin-bono@example.com'},now),/bono válido/);
assert.equal(usablePurchases(db,'bono@example.com',30).length,0);assert.equal(usablePurchases(db,'bono@example.com',60,'2027-12-01').length,0);
const month=startCheckout(db,session.id,{...data,email:'mes@example.com',kind:'mensual'},now);finishCheckout(db,month.id,'approved','card',now);assert.equal(db.purchases[1].kind,'mensual');assert.equal(db.purchases[1].validUntil,'2026-11-12');
const restored=normalizeDatabase(JSON.parse(JSON.stringify(db)));assert.equal(restored.receipts.length,3);assert.equal(restored.purchases[0].remainingCredits,6);assert.equal(restored.holds.length,db.holds.length);
const legacy=normalizeDatabase({version:1,bookings:[paid],seedChanges:{}});assert.equal(legacy.bookings.length,1);assert.deepEqual(legacy.holds,[]);assert.deepEqual(legacy.receipts,[]);
// The last place is held for checkout and then converted to exactly one booking.
const lastDB=emptyDatabase();const one=sessionsFor('2026-10-14').find(s=>s.baseCount===5);const last=startCheckout(lastDB,one.id,{...data,email:'ultimo@example.com'},now);assert.equal(available(one,lastDB,now),0);
assert.throws(()=>startCheckout(lastDB,one.id,{...data,email:'otro@example.com'},now),/completarse/);finishCheckout(lastDB,last.id,'approved','card',now);assert.equal(available(one,lastDB,now),0);assert.equal(attendees(one,lastDB).filter(b=>b.status==='confirmed').length,6);
console.log('Verificado: retención y caducidad de plazas, rechazo y reintento, pago idempotente, reembolso, saldo de bonos, cuota mensual, migración y última plaza.');

