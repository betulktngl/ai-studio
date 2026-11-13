// --- SES MOTORU ---
function bildirimSesiCal() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notalar = [523.25, 659.25, 783.99, 1046.50];
    notalar.forEach((frekans, index) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frekans, audioCtx.currentTime + index * 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + index * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + index * 0.15);
        osc.stop(audioCtx.currentTime + index * 0.15 + 0.4);
    });
}

// --- BİLDİRİM PENCERESİ ---
const bildirimModal = document.getElementById("bildirimModal");
const bildirimBaslik = document.getElementById("bildirimBaslik");
const bildirimMesaj = document.getElementById("bildirimMesaj");
const bildirimKapatBtn = document.getElementById("bildirimKapatBtn");

function uyariGoster(baslik, mesaj) {
    bildirimBaslik.innerText = baslik;
    bildirimMesaj.innerText = mesaj;
    bildirimModal.style.display = "flex";
    bildirimSesiCal();
}

bildirimKapatBtn.addEventListener("click", () => {
    bildirimModal.style.display = "none";
});

// --- 1. TEMA DEĞİŞTİRİCİ ---
const temaBtn = document.getElementById("temaBtn");
temaBtn.addEventListener("click", () => {
    document.body.classList.toggle("aydinlik-mod");
    temaBtn.innerText = document.body.classList.contains("aydinlik-mod")
        ? "🌙 Karanlık Mod"
        : "☀️ Aydınlık Mod";
});

// --- 2. KAYDIRMALI ALARM TEKERLEKLERİ ---
const saatTekerlek = document.getElementById("saatTekerlek");
const dakikaTekerlek = document.getElementById("dakikaTekerlek");
let seciliSaat = "08";
let seciliDakika = "00";

function tekerlekOlustur(container, maxSayi, baslangicDegeri, degisimCallback) {
    // Üst boşluk
    const ustBosluk = document.createElement("div");
    ustBosluk.className = "tekerlek-bosluk";
    container.appendChild(ustBosluk);

    for (let i = 0; i <= maxSayi; i++) {
        const deger = String(i).padStart(2, '0');
        const div = document.createElement("div");
        div.className = "tekerlek-eleman";
        div.innerText = deger;
        div.dataset.deger = deger;

        // Tıklayınca o sayıya kaydır
        div.addEventListener("click", () => {
            container.scrollTo({ top: i * 36, behavior: 'smooth' });
        });

        container.appendChild(div);
    }

    // Alt boşluk
    const altBosluk = document.createElement("div");
    altBosluk.className = "tekerlek-bosluk";
    container.appendChild(altBosluk);

    // Kaydırma olayını dinle ve ortadaki sayıyı seç
    container.addEventListener("scroll", () => {
        const indeks = Math.round(container.scrollTop / 36);
        const elemanlar = container.querySelectorAll(".tekerlek-eleman");
        elemanlar.forEach((el, idx) => {
            if (idx === indeks) {
                el.classList.add("secili");
                degisimCallback(el.dataset.deger);
            } else {
                el.classList.remove("secili");
            }
        });
    });

    // Başlangıç konumuna kaydır
    setTimeout(() => {
        container.scrollTop = baslangicDegeri * 36;
        const ilkEleman = container.querySelectorAll(".tekerlek-eleman")[baslangicDegeri];
        if (ilkEleman) ilkEleman.classList.add("secili");
    }, 50);
}

tekerlekOlustur(saatTekerlek, 23, 8, (val) => { seciliSaat = val; });
tekerlekOlustur(dakikaTekerlek, 59, 0, (val) => { seciliDakika = val; });

// --- CANLI SAAT & ALARM KONTROLÜ ---
let kuruluAlarm = null;

function zamaniGuncelle() {
    const simdi = new Date();
    const saat = String(simdi.getHours()).padStart(2, '0');
    const dakika = String(simdi.getMinutes()).padStart(2, '0');
    const saniye = String(simdi.getSeconds()).padStart(2, '0');

    document.getElementById("saat").innerText = `${saat}:${dakika}:${saniye}`;

    const tarihSecenekleri = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById("tarih").innerText = simdi.toLocaleDateString('tr-TR', tarihSecenekleri);

    if (kuruluAlarm === `${saat}:${dakika}` && saniye === "00") {
        uyariGoster("⏰ Alarm Çalıyor!", `Saat ${kuruluAlarm} oldu!`);
        alarmSifirla();
    }
}

setInterval(zamaniGuncelle, 1000);
zamaniGuncelle();

const alarmKurBtn = document.getElementById("alarmKurBtn");
const alarmIptalBtn = document.getElementById("alarmIptalBtn");
const alarmDurum = document.getElementById("alarmDurum");

function alarmSifirla() {
    kuruluAlarm = null;
    alarmDurum.innerText = "Aktif alarm yok";
    alarmDurum.style.color = "";
    alarmKurBtn.style.display = "inline-block";
    alarmIptalBtn.style.display = "none";
}

alarmKurBtn.addEventListener("click", () => {
    kuruluAlarm = `${seciliSaat}:${seciliDakika}`;
    alarmDurum.innerText = `🔔 Alarm ${kuruluAlarm} için kuruldu`;
    alarmDurum.style.color = "#10b981";
    alarmKurBtn.style.display = "none";
    alarmIptalBtn.style.display = "inline-block";
});

alarmIptalBtn.addEventListener("click", alarmSifirla);

// --- 3. POMODORO ODAK SAYACI ---
let pomoSure = 25 * 60;
let seciliModSure = 25 * 60;
let aktifMod = "odak"; // "odak" veya "mola"
let pomoInterval = null;

const pomodoroGosterge = document.getElementById("pomodoroGosterge");
const odakModBtn = document.getElementById("odakModBtn");
const molaModBtn = document.getElementById("molaModBtn");
const pomoBaslatBtn = document.getElementById("pomoBaslatBtn");
const pomoDurdurBtn = document.getElementById("pomoDurdurBtn");
const pomoSifirlaBtn = document.getElementById("pomoSifirlaBtn");

function pomoEkraniGuncelle() {
    const dk = String(Math.floor(pomoSure / 60)).padStart(2, '0');
    const sn = String(pomoSure % 60).padStart(2, '0');
    pomodoroGosterge.innerText = `${dk}:${sn}`;
}

odakModBtn.addEventListener("click", () => {
    clearInterval(pomoInterval);
    pomoInterval = null;
    aktifMod = "odak";
    seciliModSure = 25 * 60;
    pomoSure = seciliModSure;
    odakModBtn.classList.add("aktif");
    molaModBtn.classList.remove("aktif");
    pomoEkraniGuncelle();
});

molaModBtn.addEventListener("click", () => {
    clearInterval(pomoInterval);
    pomoInterval = null;
    aktifMod = "mola";
    seciliModSure = 5 * 60;
    pomoSure = seciliModSure;
    molaModBtn.classList.add("aktif");
    odakModBtn.classList.remove("aktif");
    pomoEkraniGuncelle();
});

pomoBaslatBtn.addEventListener("click", () => {
    if (pomoInterval === null) {
        pomoInterval = setInterval(() => {
            if (pomoSure > 0) {
                pomoSure--;
                pomoEkraniGuncelle();
            } else {
                clearInterval(pomoInterval);
                pomoInterval = null;
                if (aktifMod === "odak") {
                    uyariGoster(
                        "🎉 Tebrikler, Bitirdiniz!",
                        "25 dakikalık odaklanma seansını başarıyla tamamladın. Şimdi mola zamanı! ☕"
                    );
                } else {
                    uyariGoster(
                        "⚡ Mola Sona Erdi!",
                        "Dinlendin ve enerji topladın. Şimdi yeniden odaklanma zamanı! 🚀"
                    );
                }
            }
        }, 1000);
    }
});

pomoDurdurBtn.addEventListener("click", () => {
    clearInterval(pomoInterval);
    pomoInterval = null;
});

pomoSifirlaBtn.addEventListener("click", () => {
    clearInterval(pomoInterval);
    pomoInterval = null;
    pomoSure = seciliModSure;
    pomoEkraniGuncelle();
});

// --- 4. GELİŞMİŞ KRONOMETRE ---
let toplamSalise = 0;
let kronometreInterval = null;
let turSayaci = 0;

const kronometreGosterge = document.getElementById("kronometre");
const baslatBtn = document.getElementById("baslatBtn");
const durdurBtn = document.getElementById("durdurBtn");
const turBtn = document.getElementById("turBtn");
const sifirlaBtn = document.getElementById("sifirlaBtn");
const turListesi = document.getElementById("turListesi");

function formatliZamanGetir() {
    let toplamSaniye = Math.floor(toplamSalise / 100);
    let salise = toplamSalise % 100;
    let saat = Math.floor(toplamSaniye / 3600);
    let dakika = Math.floor((toplamSaniye % 3600) / 60);
    let saniye = toplamSaniye % 60;

    return {
        ana: `${String(saat).padStart(2, '0')}:${String(dakika).padStart(2, '0')}:${String(saniye).padStart(2, '0')}`,
        salise: `.${String(salise).padStart(2, '0')}`
    };
}

baslatBtn.addEventListener("click", () => {
    if (kronometreInterval === null) {
        kronometreInterval = setInterval(() => {
            toplamSalise++;
            const zaman = formatliZamanGetir();
            kronometreGosterge.innerHTML = `${zaman.ana}<span class="salise">${zaman.salise}</span>`;
        }, 10);
    }
});

durdurBtn.addEventListener("click", () => {
    clearInterval(kronometreInterval);
    kronometreInterval = null;
});

turBtn.addEventListener("click", () => {
    if (toplamSalise > 0) {
        turSayaci++;
        const zaman = formatliZamanGetir();
        const li = document.createElement("li");
        li.innerHTML = `<span>#${turSayaci}. Tur</span> <span>${zaman.ana}${zaman.salise}</span>`;
        turListesi.prepend(li);
    }
});

sifirlaBtn.addEventListener("click", () => {
    clearInterval(kronometreInterval);
    kronometreInterval = null;
    toplamSalise = 0;
    turSayaci = 0;
    kronometreGosterge.innerHTML = `00:00:00<span class="salise">.00</span>`;
    turListesi.innerHTML = "";
});