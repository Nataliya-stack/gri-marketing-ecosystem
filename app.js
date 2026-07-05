import { createClient } from '@supabase/supabase-js';

// 1. GLOBAL CONFIGURATION AND DOM CONSTANTS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tbody = document.getElementById('leads-table-body');
const mobileList = document.getElementById('leads-mobile-list');
const sampleRow = document.getElementById('sample-row');
const sampleMobileCard = document.getElementById('sample-mobile-card');

// Элементы управления админкой
const openBtn = document.getElementById('open-admin-btn');
const closeBtn = document.getElementById('close-modal-btn');
const modal = document.getElementById('admin-modal');
const card = document.getElementById('modal-card');
const loginBlock = document.getElementById('admin-login-block');
const contentBlock = document.getElementById('admin-content-block');
const passwordInput = document.getElementById('admin-password-input');
const submitBtn = document.getElementById('submit-password-btn');
const errorMsg = document.getElementById('login-error-msg');
const exportBtn = document.getElementById('export-csv-btn');

// Элементы модального окна ответов
const ansModal = document.getElementById('answers-modal');
const ansCard = document.getElementById('answers-modal-card');
const ansCloseBtn = document.getElementById('close-answers-btn');
const ansCloseBottomBtn = document.getElementById('close-answers-bottom-btn');
const ansLeadInfo = document.getElementById('ans-modal-lead-info');
const ansContainer = document.getElementById('ans-modal-container');

let listaLeads = [];

// Функция-очиститель имен системных ключей для вывода красивых заголовков вопросов
const limpiarClaveParaPregunta = (key) => {
    return key
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Функция-переводчик ответов (для компактного вывода и CSV)
const formatearRespuestasParaHumano = (respuestas) => {
    if (!respuestas || Object.keys(respuestas).length === 0) return 'Sin respuestas';
    
    // Автоматически собираем все готовые ответы из базы и склеиваем их в одну строку
    return Object.values(respuestas).join(' | ');
};

// Функция открытия детального окна — принимает сырой JSON-текст из дата-атрибута кнопки 🎉
const abrirModalRespuestas = (nombre, email, appOrigen, respuestasRaw) => {
    if (!ansModal || !ansCard || !ansLeadInfo || !ansContainer) return;

    const origenText = appOrigen ? appOrigen.toUpperCase() : 'CUESTIONARIO';
    ansLeadInfo.textContent = `${nombre || 'Anon'} [${origenText}] — ${email || '-'}`;
    ansContainer.innerHTML = ''; 

    let respuestas = {};
    try {
        // Десериализуем строку обратно в полноценный объект
        respuestas = typeof respuestasRaw === 'string' ? JSON.parse(respuestasRaw) : respuestasRaw;
    } catch (e) {
        console.error("Error parsing JSON:", e);
        respuestas = {};
    }
    
    if (!respuestas || Object.keys(respuestas).length === 0) {
        ansContainer.innerHTML = `<p class="text-center text-xs text-emerald-300/50 py-4">Este lead no ha dejado respuestas.</p>`;
    } else {
        // Теперь цикл гарантированно переберёт абсолютно все вопросы и ответы до единого!
        Object.keys(respuestas).forEach((key, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'modal-answer-item';

            const qTitle = document.createElement('p');
            qTitle.className = 'modal-answer-q';
            
            // Если ключ содержит нижнее подчёркивание — делаем его красивым
            const textoLimpio = key.includes('_')
                ? key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
                : key;

            qTitle.textContent = `${index + 1}. ${textoLimpio}:`; 

            const aText = document.createElement('p');
            aText.className = 'modal-answer-a';
            aText.textContent = respuestas[key]; 

            itemDiv.appendChild(qTitle);
            itemDiv.appendChild(aText);
            ansContainer.appendChild(itemDiv);
        });
    }

    ansModal.classList.remove('opacity-0', 'pointer-events-none');
    ansCard.classList.remove('scale-95');
};

const cerrarModalRespuestas = () => {
    if (!ansModal || !ansCard) return;
    ansModal.classList.add('opacity-0', 'pointer-events-none');
    ansCard.classList.add('scale-95');
};

// 2. ISOLATED ARROW FUNCTIONS
// Функция рендеринга таблицы
const renderizarTabla = (filtro) => {
    if (!tbody || !sampleRow || !mobileList || !sampleMobileCard) return;
    
    const rowTemplateBackup = sampleRow.cloneNode(true);
    const cardTemplateBackup = sampleMobileCard.cloneNode(true);

    tbody.innerHTML = '';
    mobileList.innerHTML = '';

    tbody.appendChild(rowTemplateBackup);
    mobileList.appendChild(cardTemplateBackup);

    const leadsFiltrados = filtro === 'all' 
        ? listaLeads 
        : listaLeads.filter(l => l.app_origen && l.app_origen.toLowerCase() === filtro.toLowerCase());

    if (leadsFiltrados.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 6;
        emptyCell.className = "p-8 text-center text-emerald-300/50 font-medium";
        emptyCell.textContent = "No se han registrado leads en esta categoría aún.";
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
        return;
    }

    leadsFiltrados.forEach(lead => {
        const fechaText = new Date(lead.created_at).toLocaleDateString();
        const appLabelText = lead.app_origen ? lead.app_origen.toUpperCase() : 'APP';
        const jsonString = JSON.stringify(lead.respuestas || {});

        // 🖥️ 1. РЕНДЕРИНГ ДЕСКТОП СТРОКИ
        const rowClone = rowTemplateBackup.cloneNode(true);
        rowClone.classList.remove('hidden'); 
        rowClone.id = ''; 

        const tDate = rowClone.querySelector('.td-date');
        const tName = rowClone.querySelector('.td-name');
        const tTexts = rowClone.querySelectorAll('.td-text'); 
        const tBadge = rowClone.querySelector('.td-badge');
        const tBtn = rowClone.querySelector('.view-answers-btn'); 

        if (tDate) tDate.textContent = fechaText;
        if (tName) tName.textContent = lead.nombre || 'Anon';
        if (tTexts.length >= 2) {
            tTexts[0].textContent = lead.email || '-';
            tTexts[1].textContent = lead.telefono || '-';
        }
        if (tBadge) tBadge.textContent = appLabelText;
        
        // Вместо привязки клика, просто упаковываем все данные лида прямо в атрибуты кнопки 🎉
        if (tBtn) {
            tBtn.setAttribute('data-lead-name', lead.nombre || 'Anon');
            tBtn.setAttribute('data-lead-email', lead.email || '-');
            tBtn.setAttribute('data-lead-origen', lead.app_origen || 'app');
            tBtn.setAttribute('data-lead-answers', jsonString);
        }
        
        tbody.appendChild(rowClone);

        // 📱 2. РЕНДЕРИНГ МОБИЛЬНОЙ КАРТОЧКИ
        const cardClone = cardTemplateBackup.cloneNode(true);
        cardClone.classList.remove('hidden');
        cardClone.id = '';

        const cDate = cardClone.querySelector('.card-date');
        const cApp = cardClone.querySelector('.card-badge'); 
        const cName = cardClone.querySelector('.card-name');
        const cEmail = cardClone.querySelector('.card-email');
        const cPhone = cardClone.querySelector('.card-phone');
        const cBtn = cardClone.querySelector('.view-answers-btn'); 

        if (cDate) cDate.textContent = fechaText;
        if (cApp) cApp.textContent = appLabelText;
        if (cName) cName.textContent = lead.nombre || 'Anon';
        if (cEmail) cEmail.textContent = lead.email || '-';
        if (cPhone) cPhone.textContent = lead.telefono || '-';
        
        // Точно так же упаковываем данные в мобильную кнопку 🎉
        if (cBtn) {
            cBtn.setAttribute('data-lead-name', lead.nombre || 'Anon');
            cBtn.setAttribute('data-lead-email', lead.email || '-');
            cBtn.setAttribute('data-lead-origen', lead.app_origen || 'app');
            cBtn.setAttribute('data-lead-answers', jsonString);
        }

        mobileList.appendChild(cardClone);
    });
};

const cargarLeads = async () => {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        listaLeads = data;
        renderizarTabla('all');
    } catch (err) {
        console.error('Error:', err.message);
    }
};

const cerrarModal = () => {
    if (!modal || !card || !passwordInput || !errorMsg) return;
    modal.classList.add('opacity-0', 'pointer-events-none');
    card.classList.add('scale-95');
    passwordInput.value = '';
    errorMsg.classList.add('hidden');
};

const verificarPassword = async () => {
    if (!passwordInput || !errorMsg || !loginBlock || !contentBlock) return;
    if (passwordInput.value === 'adminGRI2026') {
        errorMsg.classList.add('hidden');
        loginBlock.classList.add('hidden');
        contentBlock.classList.remove('hidden');
        await cargarLeads();
    } else {
        errorMsg.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
    }
};

// 3. CENTRAL EVENT LISTENERS BLOCK
document.addEventListener('DOMContentLoaded', () => {
    if (openBtn && modal && card && passwordInput) {
        openBtn.addEventListener('click', () => {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            card.classList.remove('scale-95');
            passwordInput.focus();
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', cerrarModal);
    if (submitBtn) submitBtn.addEventListener('click', verificarPassword);
    
    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verificarPassword();
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verificarPassword();
        });
    }

    // Подслушка кнопок закрытия модалки детальных ответов
    if (ansCloseBtn) ansCloseBtn.addEventListener('click', cerrarModalRespuestas);
    if (ansCloseBottomBtn) ansCloseBottomBtn.addEventListener('click', cerrarModalRespuestas);

    // Логика фильтрации по приложениям (универсальная)
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentBtn = e.target.closest('.filter-btn');
            if (!currentBtn) return;
            filterButtons.forEach(b => b.removeAttribute('data-active'));
            currentBtn.setAttribute('data-active', 'true');
            renderizarTabla(currentBtn.dataset.filter || 'all');
        });
    });

    // Надежный экспорт в CSV без лимитов на размер данных
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (listaLeads.length === 0) return alert('No hay datos para exportar');
            const headers = ['Fecha', 'Nombre', 'Email', 'Telefono', 'Origen', 'Respuestas'];
            const rows = listaLeads.map(lead => [
                new Date(lead.created_at).toLocaleDateString(),
                lead.nombre || 'Anon',
                lead.email || '-',
                lead.telefono || '-',
                lead.app_origen || 'APP',
                formatearRespuestasParaHumano(lead.respuestas)
            ]);
            const csvContent = [headers, ...rows]
                .map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
                .join('\n');
            const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `leads_ecosistema_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Глобальный перехватчик кликов для десктопной таблицы ПК 🎉
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const btn = e.target.closest('.view-answers-btn');
            if (!btn) return; // Если кликнули не по кнопке — игнорируем
            
            abrirModalRespuestas(
                btn.getAttribute('data-lead-name'),
                btn.getAttribute('data-lead-email'),
                btn.getAttribute('data-lead-origen'),
                btn.getAttribute('data-lead-answers')
            );
        });
    }

    // Глобальный перехватчик кликов для мобильного списка смартфонов 🎉
    if (mobileList) {
        mobileList.addEventListener('click', (e) => {
            const btn = e.target.closest('.view-answers-btn');
            if (!btn) return;
            
            abrirModalRespuestas(
                btn.getAttribute('data-lead-name'),
                btn.getAttribute('data-lead-email'),
                btn.getAttribute('data-lead-origen'),
                btn.getAttribute('data-lead-answers')
            );
        });
    }
});
