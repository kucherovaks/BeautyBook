const app = document.getElementById('app');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const toast = document.getElementById('toast');

const photos = {
  salon: 'images/salon.png',
  interior: 'images/interior.png',
  manicure: 'images/manicure.png',
  pedicure: 'images/pedicure.png',
  facial: 'images/facial.png',
  massage: 'images/massage.png',
  lashes: 'images/lashes.png'
};

const defaultServices = [
  {id:1,name:'Классический маникюр',price:1500,duration:'1 ч',icon:'💅',image:photos.manicure,desc:'Уход за ногтями и кутикулой, аккуратная обработка.'},
  {id:2,name:'Педикюр с покрытием',price:2000,duration:'1 ч 30 мин',icon:'🦶',image:photos.pedicure,desc:'Комплексный уход за стопами и ногтями.'},
  {id:3,name:'Чистка лица',price:2500,duration:'1 ч',icon:'✨',image:photos.facial,desc:'Профессиональная процедура по уходу за кожей.'},
  {id:4,name:'Массаж спины',price:2500,duration:'1 ч',icon:'🌿',image:photos.massage,desc:'Расслабляющий массаж для снятия напряжения.'},
  {id:5,name:'Ламинирование ресниц',price:2000,duration:'1 ч',icon:'👁️',image:photos.lashes,desc:'Выразительный взгляд и аккуратная форма ресниц.'},
  {id:6,name:'Маникюр + гель-лак',price:2800,duration:'2 ч',icon:'💗',image:photos.manicure,desc:'Маникюр и стойкое покрытие гель-лаком.'}
];

const specialists = [
  {id:1,name:'Анна Иванова',role:'Мастер маникюра и педикюра',exp:'5 лет',rating:'4.9',services:[1,2,6],photo:'images/Анна Иванова.png'},
  {id:2,name:'Екатерина Смирнова',role:'Мастер маникюра',exp:'4 года',rating:'4.8',services:[1,6],photo:'images/Екатерина Смирнова.png'},
  {id:3,name:'Мария Кузнецова',role:'Косметолог',exp:'6 лет',rating:'4.9',services:[3,5],photo:'images/Мария Кузнецова.png'},
  {id:4,name:'Ольга Петрова',role:'Массажист',exp:'7 лет',rating:'5.0',services:[4],photo:'images/Ольга Петрова.png'}
];

const storedServices = JSON.parse(localStorage.getItem('beautybook_services') || 'null');
let services = storedServices?.map(service => {
  // Saved catalogs can still contain the original stock photo URLs.
  if (!/^https:\/\/images\.unsplash\.com\//.test(service.image)) return service;

  const defaultService = defaultServices.find(item => item.id === service.id);
  return { ...service, image: defaultService?.image ?? photos.facial };
}) ?? defaultServices;
const bookingStorageKey = 'beautybook_bookings';
const accountStorageKey = 'beautybook_accounts';
const sessionStorageKey = 'beautybook_account';
const isAdmin = document.body.dataset.site === 'admin';

let bookings = readBookings();
let currentAccount = isAdmin ? null : readAccounts().find(account => account.email === sessionStorage.getItem(sessionStorageKey));
let currentPage = 'home';
let returnFromSelectedSpecialists;
let specialistList;
let bookingDraft = newBookingDraft();

function readBookings(){ return JSON.parse(localStorage.getItem(bookingStorageKey) || '[]'); }
function saveBookings(){ localStorage.setItem(bookingStorageKey, JSON.stringify(bookings)); }
function saveServices(){ localStorage.setItem('beautybook_services', JSON.stringify(services)); }
function readAccounts(){ return JSON.parse(localStorage.getItem(accountStorageKey) || '[]'); }
function newBookingDraft(){
  return {service:null, specialist:null, date:null, time:null, clientName:'', phone:''};
}
function escapeHtml(value){
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function money(n){ return Number(n).toLocaleString('ru-RU')+' ₽'; }
function toastMsg(t){ toast.textContent=t; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2400); }
function closeModal(){ modal.classList.add('hidden'); }
function row(a,b){ return `<div class="detail-row"><span class="muted">${a}</span><b>${b}</b></div>`; }
function footer(){ return `<footer class="footer"><div class="container"><b>✿ BeautyBook</b><p class="muted">Онлайн-запись на бьюти-услуги салона BeautyBook.</p></div></footer>`; }
function img(url,alt=''){ return `<img src="${url}" alt="${alt}" loading="lazy" onerror="this.style.display='none'">`; }

function showPage(page, fromCabinet=false){
  currentPage = page;
  window.scrollTo({top:0,behavior:'smooth'});
  const pages = {
    home: renderHome,
    services: () => renderServices(fromCabinet),
    specialists: () => openSpecialistList(null, () => showPage(fromCabinet ? 'cabinet' : 'home')),
    about: renderAbout,
    contacts: renderContacts,
    cabinet: renderCabinet
  };
  if(pages[page]) pages[page]();
}

function serviceCard(s){
 return `<div class="card"><div class="service-img">${img(s.image,s.name)}</div><span class="tag">${s.duration}</span><h3>${s.name}</h3><p class="muted">${s.desc}</p><div class="card-row"><span class="price">${money(s.price)}</span><button class="btn" onclick="startBookingFromService(${s.id})">Записаться</button></div></div>`;
}

function renderHome(){
 returnFromSelectedSpecialists = () => showPage('home');
 app.innerHTML=`<section class="hero"><div class="container hero-grid"><div><div class="eyebrow">BeautyBook · салон красоты</div><h1>Онлайн-запись на бьюти-услуги</h1><p class="lead">Выберите услугу, специалиста и удобное время — запись займёт всего несколько минут.</p><div class="actions"><button class="btn" onclick="showPage('services')">Выбрать услугу</button><button class="btn secondary" onclick="showPage('specialists')">Выбрать специалиста</button></div></div><div class="hero-photo">${img(photos.salon,'Интерьер салона')}</div></div></section>
 <div class="container features"><div class="feature">✓ <b>Удобная запись</b><span class="muted">Онлайн в любое время</span></div><div class="feature">⚡︎ <b>Профессионалы</b><span class="muted">Опытные специалисты</span></div><div class="feature">◴ <b>Актуальное расписание</b><span class="muted">Свободные интервалы</span></div><div class="feature">♡ <b>Личный кабинет</b><span class="muted">Все записи клиента</span></div></div>
 <section class="section"><div class="container"><div class="section-head"><div><h2>Популярные услуги</h2><span class="muted">Выберите услугу — после этого откроется список подходящих специалистов</span></div><button class="btn secondary" onclick="showPage('services')">Все услуги</button></div><div class="grid">${services.slice(0,3).map(serviceCard).join('')}</div></div></section>
 <section class="section salon-preview"><div class="container"><div class="section-head"><div><h2>Наш салон</h2><span class="muted">Уютное пространство BeautyBook</span></div><button class="btn secondary" onclick="showPage('about')">Подробнее</button></div><div class="gallery"><div class="gallery-main">${img(photos.interior,'Интерьер BeautyBook')}</div><div>${img(photos.facial,'Косметологическая зона')}</div><div>${img(photos.manicure,'Маникюрная зона')}</div></div></div></section>${footer()}`;
}

function renderServices(fromCabinet){
 returnFromSelectedSpecialists = () => showPage('services', fromCabinet);
 const back = fromCabinet ? '<button class="back-link" onclick="showPage(\'cabinet\')">← Назад</button>' : '';
 app.innerHTML=`<div class="container page-title">${back}<h1>Каталог услуг</h1><p>Выберите услугу. Система сразу покажет специалистов, которые её выполняют.</p></div><section class="section" style="padding-top:10px"><div class="container"><div class="filters"><div class="filter-item"><input id="serviceSearch" class="search" placeholder="Поиск по услугам..." oninput="filterServices()"></div><div class="filter-item"><select id="serviceSort" class="select" onchange="filterServices()"><option value="popular">Популярные</option><option value="priceUp">Цена по возрастанию</option><option value="priceDown">Цена по убыванию</option></select></div></div><div id="serviceGrid" class="grid">${services.map(serviceCard).join('')}</div></div></section>${footer()}`;
}
function filterServices(){
 const q=document.getElementById('serviceSearch').value.toLowerCase(), sort=document.getElementById('serviceSort').value;
 let arr=services.filter(s=>s.name.toLowerCase().includes(q));
 if(sort==='priceUp') arr.sort((a,b)=>a.price-b.price); if(sort==='priceDown') arr.sort((a,b)=>b.price-a.price);
 document.getElementById('serviceGrid').innerHTML=arr.map(serviceCard).join('');
}

function specialistCard(s, selectedServiceId=null){
 const available=selectedServiceId ? s.services.includes(selectedServiceId) : true;
 if(!available) return '';
 return `<div class="card"><div class="specialist"><div class="avatar-photo">${img(s.photo,s.name)}</div><div><h3>${s.name}</h3><div class="muted">${s.role}</div><div class="rating">★ ${s.rating} · опыт ${s.exp}</div></div></div><hr style="border:0;border-top:1px solid var(--line);margin:17px 0"><p class="muted">${selectedServiceId ? 'Выполняет выбранную услугу' : 'Доступные услуги: '+s.services.map(id=>services.find(x=>x.id===id)?.name).join(', ')}</p><button class="btn" style="width:100%" onclick="chooseSpecialist(${s.id},${selectedServiceId||'null'})">Выбрать специалиста</button></div>`;
}

function openSpecialistList(serviceId, goBack){
 specialistList = {serviceId, goBack};
 renderSpecialists();
}

function renderSpecialists(){
 const selectedServiceId = specialistList.serviceId;
 const selected=selectedServiceId?services.find(s=>s.id===selectedServiceId):null;
 app.innerHTML=`<div class="container page-title"><button class="back-link" onclick="specialistList.goBack()">← Назад</button><h1>Выберите специалиста</h1><p>${selected?`Услуга уже выбрана: <b>${selected.name}</b>. Теперь выберите специалиста — повторно выбирать услугу не потребуется.`:'Сначала выберите специалиста, затем одну из его услуг.'}</p></div><section class="section" style="padding-top:5px"><div class="container">${selected?`<div class="selected-banner"><span>Выбрано</span><b>${selected.icon} ${selected.name}</b><span>${money(selected.price)} · ${selected.duration}</span></div>`:''}<div class="grid">${specialists.map(s=>specialistCard(s,selectedServiceId)).join('')}</div></div></section>${footer()}`;
}

function chooseSpecialist(specialistId, serviceId=null){
 bookingDraft = newBookingDraft();
 bookingDraft.specialist=specialists.find(s=>s.id===specialistId);
 if(serviceId){
  // Если услуга была выбрана заранее (например, из «Популярных услуг»),
  // после выбора мастера сразу переходим к выбору даты и времени.
  bookingDraft.service=services.find(s=>s.id===serviceId);
  renderDateTime();
  return;
 }
 // Если пользователь начал запись с карточки специалиста,
 // сначала предлагаем выбрать услугу этого специалиста.
 renderSpecialistServices();
}

function renderSpecialistServices(){
 const s=bookingDraft.specialist;
 const available=s.services.map(id=>services.find(x=>x.id===id)).filter(Boolean);
 app.innerHTML=`<div class="container section"><div class="booking-head"><button class="back-link" onclick="renderSpecialists()">← Назад к специалистам</button><h1>${s.name}: выберите услугу</h1><p>${s.role}. Здесь отображаются только услуги этого специалиста.</p></div><div class="specialist-hero card"><div class="avatar-photo large">${img(s.photo,s.name)}</div><div><h2>${s.name}</h2><div class="muted">${s.role} · опыт ${s.exp} · ★ ${s.rating}</div></div></div><div class="grid service-choice-grid">${available.map(x=>`<div class="card ${bookingDraft.service?.id===x.id?'selected-card':''}"><div class="service-img small">${img(x.image,x.name)}</div><h3>${x.name}</h3><p class="muted">${x.duration}</p><div class="card-row"><b class="price">${money(x.price)}</b><button class="btn" onclick="selectSpecialistService(${x.id})">${bookingDraft.service?.id===x.id?'Выбрано':'Выбрать'}</button></div></div>`).join('')}</div></div>${footer()}`;
}
function selectSpecialistService(id){
 if(bookingDraft.service?.id !== id){
  bookingDraft.date = null;
  bookingDraft.time = null;
 }
 bookingDraft.service = services.find(s => s.id === id);
 renderDateTime();
}

function startBookingFromService(serviceId){
 openSpecialistList(serviceId, returnFromSelectedSpecialists);
}

function getAvailableTimes(date){
 const all=['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];
 const busy=bookings.filter(b=>Number(b.date)===Number(date)&&b.specialist===bookingDraft.specialist?.name&&b.status!=='Отменена').map(b=>b.time);
 return all.filter(t=>!busy.includes(t));
}
function renderDateTime(){
 bookings = readBookings();
 const days=[16,17,18,19,20,21,22,23,24,25,26,27,28,29];
 const times=bookingDraft.date?getAvailableTimes(bookingDraft.date):[];
 app.innerHTML=`<div class="container section"><div class="steps"><div class="step active">1. Специалист</div><div class="step active">2. Услуга</div><div class="step active">3. Дата и время</div><div class="step">4. Подтверждение</div></div><div class="booking-layout"><div class="card summary"><button class="back-link" onclick="renderSpecialistServices()">← Назад к услугам</button><div class="service-img small">${img(bookingDraft.service.image,bookingDraft.service.name)}</div><h3>${bookingDraft.service.name}</h3><p class="muted">${bookingDraft.specialist.name}</p><b class="price">${money(bookingDraft.service.price)}</b></div><div class="card"><h2>Выберите свободную дату</h2><div class="calendar">${days.map(d=>`<button class="day ${bookingDraft.date===d?'selected':''}" onclick="bookingDraft.date=${d};bookingDraft.time=null;renderDateTime()">${d}</button>`).join('')}</div>${bookingDraft.date?`<h2 style="margin-top:25px">Свободное время на ${bookingDraft.date} октября</h2><div class="times">${times.length?times.map(t=>`<button class="time ${bookingDraft.time===t?'selected':''}" onclick="bookingDraft.time='${t}';renderDateTime()">${t}</button>`).join(''):'<p class="muted">На выбранную дату свободных интервалов нет.</p>'}</div>`:''}<div class="actions"><button class="btn secondary" onclick="renderSpecialistServices()">← Назад</button><button class="btn" ${(!bookingDraft.date||!bookingDraft.time)?'disabled':''} onclick="renderConfirm()">Далее →</button></div></div></div></div>${footer()}`;
}

function renderConfirm(){
 app.innerHTML=`<div class="container section"><div class="steps"><div class="step active">1. Специалист</div><div class="step active">2. Услуга</div><div class="step active">3. Дата и время</div><div class="step active">4. Подтверждение</div></div><div class="confirm" style="max-width:720px;margin:auto"><button class="back-link" onclick="renderDateTime()">← Назад к выбору времени</button><h1>Подтверждение записи</h1>${row('Услуга',bookingDraft.service.name)}${row('Специалист',bookingDraft.specialist.name)}${row('Дата',bookingDraft.date+' октября 2026')}${row('Время',bookingDraft.time)}${row('Стоимость',money(bookingDraft.service.price))}<div class="form-grid" style="margin-top:18px"><label>Ваше имя<input id="clientName" class="input" placeholder="Иван Иванов" autocomplete="name" value="${escapeHtml(bookingDraft.clientName || currentAccount?.name || '')}"></label><label>Телефон<input id="clientPhone" class="input" placeholder="+7 (999) 000-00-00" type="tel" autocomplete="tel" value="${escapeHtml(bookingDraft.phone)}"></label></div><div class="actions"><button class="btn secondary" onclick="renderDateTime()">← Назад</button><button class="btn" onclick="confirmBooking()">Подтвердить запись</button></div></div></div>${footer()}`;
}

function confirmBooking(){
 const name=document.getElementById('clientName').value.trim(), phone=document.getElementById('clientPhone').value.trim();
 if(!name||!phone){toastMsg('Заполните имя и телефон');return;}
 bookingDraft.clientName=name;bookingDraft.phone=phone;
 if(!currentAccount){ renderAuth('login', true); return; }
 bookings = readBookings();
 if(getAvailableTimes(bookingDraft.date).includes(bookingDraft.time)===false){toastMsg('Это время уже заняли. Выберите другое.');renderDateTime();return;}
 bookings.unshift({id:Date.now(),accountEmail:currentAccount.email,service:bookingDraft.service.name,serviceId:bookingDraft.service.id,specialist:bookingDraft.specialist.name,specialistId:bookingDraft.specialist.id,date:bookingDraft.date,time:bookingDraft.time,name,phone,status:'Активна',price:bookingDraft.service.price});
 saveBookings();toastMsg('Запись успешно создана');showPage('cabinet');
}

async function hashPassword(password, salt){
 const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
 const bits = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt:new Uint8Array(salt), iterations:600000}, key, 256);
 return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
}

function renderAuth(mode='login', resumeBooking=false, email=''){
 const registering = mode === 'register';
 const title = registering ? 'Регистрация' : 'Вход в личный кабинет';
 app.innerHTML = `<div class="container section">
  <section class="card auth-card" aria-labelledby="authTitle">
   <button class="back-link" type="button" id="authBack">← Назад</button>
   <h1 id="authTitle">${title}</h1>
   ${resumeBooking ? '<p class="muted">Войдите или зарегистрируйтесь, чтобы подтвердить запись.</p>' : ''}
   <form class="auth-form">
    ${registering ? '<label>Имя<input class="input" name="name" autocomplete="name" required></label>' : ''}
    <label>Электронная почта<input class="input" name="email" type="email" autocomplete="email" required></label>
    <label>Пароль<input class="input" name="password" type="password" autocomplete="${registering ? 'new-password' : 'current-password'}" ${registering ? 'minlength="8" aria-describedby="passwordHint"' : ''} required></label>
    ${registering ? '<p class="muted" id="passwordHint">Не менее 8 символов.</p>' : ''}
    <p class="auth-error" role="alert" hidden></p>
    <button class="btn" type="submit">${registering ? 'Зарегистрироваться' : 'Войти'}</button>
   </form>
   <div class="auth-switch">
    <span class="muted">${registering ? 'Уже есть аккаунт?' : 'Ещё нет аккаунта?'}</span>
    <button class="back-link" type="button" id="authSwitch">${registering ? 'Войти' : 'Зарегистрироваться'}</button>
   </div>
  </section>
 </div>${footer()}`;

 const form = app.querySelector('.auth-form');
 form.elements.email.value = email;
 app.querySelector('#authBack').addEventListener('click', () => {
  if(resumeBooking) renderConfirm();
  else showPage('home');
 });
 app.querySelector('#authSwitch').addEventListener('click', () => {
  renderAuth(registering ? 'login' : 'register', resumeBooking, form.elements.email.value);
 });
 form.addEventListener('submit', event => {
  event.preventDefault();
  submitAuth(form, registering, resumeBooking);
 });
 app.querySelector('#authTitle').setAttribute('tabindex', '-1');
 app.querySelector('#authTitle').focus();
}

async function submitAuth(form, registering, resumeBooking){
 const error = form.querySelector('.auth-error');
 const submit = form.querySelector('button[type="submit"]');
 const email = form.elements.email.value.trim().toLowerCase();
 const password = form.elements.password.value;
 const name = registering ? form.elements.name.value.trim() : '';
 const showError = message => { error.textContent = message; error.hidden = false; };
 error.hidden = true;
 if(registering && !name){ showError('Введите имя.'); return; }
 if(!globalThis.crypto?.subtle){ showError('Для входа откройте сайт через localhost или HTTPS.'); return; }
 submit.disabled = true;
 try {
  let account = readAccounts().find(item => item.email === email);
  if(registering){
   if(account){ showError('Аккаунт с этой почтой уже существует. Войдите в него.'); return; }
   const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
   const hash = await hashPassword(password, salt);
   if(!form.isConnected) return;
   const accounts = readAccounts();
   if(accounts.some(item => item.email === email)){ showError('Аккаунт с этой почтой уже существует. Войдите в него.'); return; }
   account = {email, name, salt, hash};
   localStorage.setItem(accountStorageKey, JSON.stringify([...accounts, account]));
  } else if(!account || await hashPassword(password, account.salt) !== account.hash){
   showError('Неверная электронная почта или пароль.');
   return;
  }
  if(!form.isConnected) return;
  sessionStorage.setItem(sessionStorageKey, account.email);
  currentAccount = account;
  if(resumeBooking) renderConfirm();
  else showPage('cabinet');
 } catch {
  showError('Не удалось сохранить или открыть аккаунт. Проверьте, доступно ли хранилище браузера.');
 } finally {
  submit.disabled = false;
 }
}

function signOut(){
 sessionStorage.removeItem(sessionStorageKey);
 currentAccount = null;
 bookingDraft = newBookingDraft();
 showPage('cabinet');
}

function renderCabinet(){
 if(!currentAccount){ renderAuth(); return; }
 bookings = readBookings();
 const active = bookings.filter(b => b.accountEmail === currentAccount.email && b.status === 'Активна');
 const bookingHtml = active.length ? active.map(b => `<div class="booking-item">
  <div class="booking-icon" aria-hidden="true">💅</div>
  <div><b>${escapeHtml(b.service)}</b><div class="muted">${escapeHtml(b.specialist)}</div>
  <div class="muted">${escapeHtml(b.date)} октября · ${escapeHtml(b.time)} · ${money(b.price)}</div></div>
  <div><span class="status">${b.status}</span><br>
  <button class="btn secondary" style="margin-top:9px" onclick="requestCancellation(${b.id})">Отменить</button></div>
 </div>`).join('') : `<p class="muted">У вас нет активных записей.</p><button class="btn light" onclick="showPage('services', true)">Выбрать услугу</button>`;
 app.innerHTML = `<div class="container section">
  <div class="page-title cabinet-title"><div><h1>Личный кабинет</h1><p>${escapeHtml(currentAccount.name)}</p></div>
  <button class="btn secondary" onclick="signOut()">Выйти</button></div>
  <div class="account"><div class="card side-menu">
   <button class="active" aria-current="page">✓ Мои записи</button>
   <button onclick="showPage('services', true)">＋ Новая запись</button>
   <button onclick="showPage('specialists', true)">♡ Специалисты</button>
  </div><div class="card"><h2>Мои записи</h2>${bookingHtml}</div></div>
 </div>${footer()}`;
}

function updateBookingStatus(id, status){
 bookings = readBookings();
 const booking = bookings.find(b => b.id === id && b.status === 'Активна');
 if(!booking || (!isAdmin && (!currentAccount || booking.accountEmail !== currentAccount.email))) return;
 booking.status = status;
 saveBookings();
 toastMsg(status === 'Отменена' ? 'Запись отменена' : 'Статус записи обновлён');
 if(isAdmin) renderAdmin();
 else renderCabinet();
}

function requestCancellation(id){
 const dialog = document.createElement('dialog');
 dialog.className = 'cancel-dialog';
 dialog.setAttribute('aria-labelledby', 'cancelTitle');
 dialog.innerHTML = `<form method="dialog">
  <h2 id="cancelTitle">Отменить запись?</h2>
  <p class="muted">После отмены запись исчезнет из личного кабинета.</p>
  <div class="actions">
   <button class="btn value" value="keep" autofocus>Оставить запись</button>
   <button class="btn secondary" value="cancel">Да, отменить</button>
  </div>
 </form>`;
 dialog.addEventListener('close', () => {
  dialog.remove();
  if(dialog.returnValue === 'cancel') updateBookingStatus(id, 'Отменена');
 }, {once:true});
 document.body.append(dialog);
 dialog.showModal();
}

function renderAbout(){
 app.innerHTML=`<div class="container section"><div class="page-title" style="padding-top:0"><span class="eyebrow">BeautyBook</span><h1>О салоне</h1><p>Уютное пространство для ухода за собой и спокойного отдыха.</p></div><div class="about-hero card"><div><h2>BeautyBook — салон красоты</h2><p>Мы создали пространство, где клиент может самостоятельно выбрать услугу, подходящего специалиста и удобное время посещения.</p><p class="muted">Москва, ул. Примерная, 10 · ежедневно 09:00–21:00</p></div><div class="about-photo">${img(photos.interior,'Интерьер салона')}</div></div><h2 style="margin-top:40px">Атмосфера салона</h2><div class="gallery"><div class="gallery-main">${img(photos.salon,'Салон BeautyBook')}</div><div>${img(photos.facial,'Косметологическая зона')}</div><div>${img(photos.manicure,'Маникюрная зона')}</div><div>${img(photos.massage,'Зона массажа')}</div></div></div>${footer()}`;
}
function renderContacts(){ app.innerHTML=`<div class="container section"><div class="page-title" style="padding-top:0"><h1>Контакты</h1><p>Свяжитесь с администратором салона.</p></div><div class="grid"><div class="card"><h3>Адрес</h3><p class="muted">Москва, ул. Примерная, 10</p></div><div class="card"><h3>Телефон</h3><p class="muted">+7 (999) 000-00-00</p></div><div class="card"><h3>Время работы</h3><p class="muted">Ежедневно, 09:00–21:00</p></div></div></div>${footer()}`; }

function renderAdmin(){
 bookings = readBookings();
 const active=bookings.filter(b=>b.status==='Активна');
 app.innerHTML=`<div class="admin-top"><div class="container"><div><span class="eyebrow">BeautyBook · Staff</span><h1>Панель салона</h1><p class="muted">Управление записями, расписанием и услугами.</p></div><a class="btn secondary" href="index.html">Открыть сайт клиента</a></div></div><div class="container section"><div class="admin-grid"><div class="card"><span class="muted">Активные записи</span><h2>${active.length}</h2></div><div class="card"><span class="muted">Услуги</span><h2>${services.length}</h2></div><div class="card"><span class="muted">Специалисты</span><h2>${specialists.length}</h2></div></div><div class="admin-tabs"><button class="btn" onclick="renderAdminBookings()">Записи</button><button class="btn secondary" onclick="renderAdminSchedule()">Расписание</button><button class="btn secondary" onclick="renderAdminServices()">Услуги</button></div><div id="adminContent"></div></div>${footer()}`;
 renderAdminBookings();
}
function adminStatusButton(b){return `<div class="admin-booking"><div><b>${b.service}</b><div class="muted">${escapeHtml(b.name)} · ${escapeHtml(b.phone)}</div><div class="muted">${b.specialist} · ${b.date} октября · ${b.time}</div></div><div><span class="status">${b.status}</span><div class="admin-actions">${b.status==='Активна'?`<button class="btn small" onclick="updateBookingStatus(${b.id},'Завершена')">Завершить</button><button class="btn secondary small" onclick="requestCancellation(${b.id})">Отменить</button>`:''}</div></div></div>`}
function renderAdminBookings(){document.getElementById('adminContent').innerHTML=`<div class="card"><h2>Все записи</h2>${bookings.length?bookings.map(adminStatusButton).join(''):'<p class="muted">Записей пока нет.</p>'}</div>`;}
function renderAdminSchedule(){
 const times=['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
 document.getElementById('adminContent').innerHTML=`<div class="card"><h2>Расписание</h2>${specialists.map(s=>`<div class="schedule-block"><h3>${s.name}</h3>${times.map(t=>{const b=bookings.find(x=>x.specialist===s.name&&x.time===t&&x.status==='Активна');return `<div class="schedule-row"><b>${t}</b><span>${b?b.service+' · '+escapeHtml(b.name):'Свободно'}</span><span class="${b?'busy':'free'}">${b?'Занято':'Свободно'}</span></div>`}).join('')}</div>`).join('')}</div>`;
}
function renderAdminServices(){document.getElementById('adminContent').innerHTML=`<div class="card"><div class="section-head"><div><h2>Услуги салона</h2><span class="muted">Добавляйте и удаляйте услуги.</span></div><button class="btn" onclick="openAddService()">+ Добавить услугу</button></div><div class="service-list">${services.map(s=>`<div class="service-line"><div class="mini-img">${s.icon}</div><div class="grow"><b>${s.name}</b><div class="muted">${s.duration} · ${money(s.price)}</div></div><button class="btn secondary" onclick="deleteService(${s.id})">Удалить</button></div>`).join('')}</div></div>`;}
function openAddService(){modalContent.innerHTML=`<h2>Новая услуга</h2><div class="form-grid"><label class="full">Название<input id="newName" class="input"></label><label>Цена<input id="newPrice" class="input" type="number"></label><label>Продолжительность<input id="newDuration" class="input" placeholder="1 ч"></label><label class="full">Описание<textarea id="newDesc" class="textarea" rows="4"></textarea></label></div><button class="btn" style="margin-top:18px" onclick="addService()">Сохранить</button>`;modal.classList.remove('hidden');}
function addService(){const n=document.getElementById('newName').value.trim(),p=Number(document.getElementById('newPrice').value),d=document.getElementById('newDuration').value.trim(),desc=document.getElementById('newDesc').value.trim();if(!n||!p||!d){toastMsg('Заполните обязательные поля');return;}services.push({id:Date.now(),name:n,price:p,duration:d,icon:'✨',image:photos.facial,desc:desc||'Новая услуга салона.'});saveServices();closeModal();toastMsg('Услуга добавлена');renderAdmin();}
function deleteService(id){services=services.filter(s=>s.id!==id);saveServices();toastMsg('Услуга удалена');renderAdmin();}

if(isAdmin) renderAdmin();
else {
 window.addEventListener('storage', event => {
  if(event.key === bookingStorageKey && currentPage === 'cabinet' && currentAccount) renderCabinet();
 });
 showPage('home');
}
