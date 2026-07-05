import { createClient } from '@supabase/supabase-js'

// Автоматически подтягиваем скрытые ключи из файла .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Создаем официальное подключение к базе данных
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔌 ¡Base de datos Supabase conectada con éxito al ecosistema!')

// Переменная для хранения скачанных лидов
let listaLeads = [];

document.addEventListener('DOMContentLoaded', () => {
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

    // Функция открытия окна
    if (openBtn && modal && card) {
        openBtn.addEventListener('click', () => {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            card.classList.remove('scale-95');
            passwordInput.focus();
        });
    }

    // Функция закрытия окна
    const cerrarModal = () => {
        modal.classList.add('opacity-0', 'pointer-events-none');
        card.classList.add('scale-95');
        passwordInput.value = '';
        errorMsg.classList.add('hidden');
    };

    if (closeBtn) closeBtn.addEventListener('click', cerrarModal);

    // Логика проверки пароля
    const verificarPassword = async () => {
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

    if (submitBtn) submitBtn.addEventListener('click', verificarPassword);
    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verificarPassword();
        });
    }

    // Логика фильтров таблицы
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.replace('bg-emerald-600', 'bg-white/5'));
            filterButtons.forEach(b => b.classList.replace('text-white', 'text-emerald-200'));
            
            btn.classList.replace('bg-white/5', 'bg-emerald-600');
            btn.classList.replace('text-emerald-200', 'text-white');
            
            renderizarTabla(e.target.dataset.filter);
        });
    });

    // Логика экспорта в CSV (Excel)
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (listaLeads.length === 0) return alert('No hay datos para exportar');
            
            let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
            csvContent += "Fecha,Nombre,Email,Telefono,Origen,Respuestas\n";
            
            listaLeads.forEach(lead => {
                const fecha = new Date(lead.created_at).toLocaleDateString();
                const respuestas = JSON.stringify(lead.respuestas).replace(/"/g, '""');
                csvContent += `"${fecha}","${lead.nombre}","${lead.email}","${lead.telefono}","${lead.app_origen}","${respuestas}"\n`;
            });
            
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "leads_ecosistema_gri.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});

// Скачивание данных из Supabase
async function cargarLeads() {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        listaLeads = data;
        
        // ВЫВОДИМ ЖИВОЙ МАССИВ В КОНСОЛЬ (Как вы и просили!)
        console.log('📊 Datos de leads cargados desde Supabase:', data);
        
        renderizarTabla('all');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

// Отрисовка строк таблицы на экране
function renderizarTabla(filtro) {
    const tbody = document.getElementById('leads-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const leadsFiltrados = filtro === 'all' 
        ? listaLeads 
        : listaLeads.filter(l => l.app_origen === filtro);

    if (leadsFiltrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-emerald-300/50 font-medium">No se han registrado leads en esta categoría aún.</td></tr>`;
        return;
    }

    leadsFiltrados.forEach(lead => {
        const fecha = new Date(lead.created_at).toLocaleDateString();
        const respuestasText = JSON.stringify(lead.respuestas);
        
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 transition-colors";
        tr.innerHTML = `
            <td class="p-4 font-medium text-emerald-200">${fecha}</td>
            <td class="p-4 text-white font-semibold">${lead.nombre}</td>
            <td class="p-4 text-emerald-100">${lead.email}</td>
            <td class="p-4 text-emerald-100">${lead.telefono}</td>
            <td class="p-4"><span class="px-2 py-1 text-xs font-bold rounded-md bg-emerald-500/20 text-emerald-300">${lead.app_origen.toUpperCase()}</span></td>
            <td class="p-4 text-xs max-w-xs truncate text-emerald-300/70" title='${respuestasText}'>${respuestasText}</td>
        `;
        tbody.appendChild(tr);
    });
}
