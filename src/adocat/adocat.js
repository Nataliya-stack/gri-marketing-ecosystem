// 📚 LOGIC FOR ADOCAT APPLICATION
import { QuizEngine } from './adocat-engine.js';

// 1. GLOBAL DOM CONSTANTS SELECTION (Все константы строго наверху в один ряд)
const startBtn = document.getElementById('start-quiz-btn');
const welcomeScreen = document.getElementById('welcome-screen');
const quizFlowContainer = document.getElementById('quiz-flow-container');
const stepsHolder = document.getElementById('dynamic-steps-holder');
const progressBar = document.getElementById('progress-bar');
const stepCounter = document.getElementById('step-counter');

const leadForm = document.getElementById('lead-form-adocat');
const inputNombre = document.getElementById('lead-nombre');
const inputEmail = document.getElementById('lead-email');
const inputTelefono = document.getElementById('lead-telefono');

const stepCardForm = document.getElementById('step-card-form');
const stepCardSuccess = document.getElementById('step-card-success');

const questionTemplate = document.getElementById('question-template');
const buttonTemplate = document.getElementById('button-template');

// Элементы нового светлого модального окна CTA
const btnSocio = document.getElementById('btn-cta-socio');
const btnColaborar = document.getElementById('btn-cta-colaborar');
const btnBoletin = document.getElementById('btn-cta-boletin');
const ctaModal = document.getElementById('cta-modal');
const ctaModalCard = document.getElementById('cta-modal-card');
const btnCloseCtaModal = document.getElementById('close-cta-modal-btn');
const btnCloseCtaBottom = document.getElementById('close-cta-modal-bottom-btn');

// Инициализируем наш умный класс-движок, упаковывая одиночные переменные в объект
const engine = new QuizEngine({
    startBtn, welcomeScreen, quizFlowContainer, stepsHolder, progressBar, stepCounter,
    leadForm, inputNombre, inputEmail, inputTelefono, stepCardForm, stepCardSuccess,
    questionTemplate, buttonTemplate, btnSocio, btnColaborar, btnBoletin, ctaModal, ctaModalCard
});

// 2. CENTRAL EVENT LISTENERS SETUP USING ADDEVENTLISTENER (Центральная подслушка)
document.addEventListener('DOMContentLoaded', () => {
    console.log('👑 ADOCAT Modular OOP Engine initialized successfully.');

    // Подслушка кнопки старта
    if (startBtn) {
        startBtn.addEventListener('click', engine.start);
    }

    // Подслушка отправки формы контактов в облако
    if (leadForm) {
        leadForm.addEventListener('submit', engine.syncWithDatabase);
    }

    // Подслушка кнопок закрытия всплывающего модального окна (крестик и низ)
    if (btnCloseCtaModal) btnCloseCtaModal.addEventListener('click', engine.closeModal);
    if (btnCloseCtaBottom) btnCloseCtaBottom.addEventListener('click', engine.closeModal);

    // 🌟 ПОДСПЛУШКА ФИНАЛЬНЫХ КНОПОК CTA В ФОНЕ ТЕСТА:
    
    // 1. Клик по кнопке "Hazte socio"
    if (btnSocio) {
        btnSocio.addEventListener('click', () => {
            engine.openModal(
                "📄 Alta de Socio - ADOCAT",
                `<p>Gracias por dar el paso para unirse a ADOCAT. Al convertirse en socio, obtendrá acceso prioritario a las bolsas de trabajo del SOC y soporte técnico especializado.</p>
                 <p>Hemos enviado un documento de <strong>Alta Oficial (PDF)</strong> a su correo electrónico. Por favor, revise su bandeja de entrada para firmar digitalmente el acuerdo de incorporación.</p>`
            );
        });
    }

    // 2. Клик по кнопке "Quiero colaborar"
    if (btnColaborar) {
        btnColaborar.addEventListener('click', () => {
            engine.openModal(
                "🤝 Colaboración Ocupacional",
                `<p>Estamos encantados de colaborar en sus proyectos formativos. Nuestro departamento de captación revisará su perfil docente para asignarle un asesor exclusivo.</p>
                 <p>En menos de 24 horas laborables nos pondremos en contacto con usted por teléfono para agendar una breve reunión virtual y definir las tarifas de colaboración.</p>`
            );
        });
    }

    // 3. Клик по кнопке "Suscribirme al boletín"
    if (btnBoletin) {
        btnBoletin.addEventListener('click', () => {
            // Никакого хардкодного CSS! Выставляем нативное состояние disabled.
            // Кнопка автоматически станет полупрозрачной и заблокируется благодаря правилам в style.css
            btnBoletin.setAttribute('disabled', 'true');
            btnBoletin.textContent = "✓ Suscrito";
            
            engine.openModal(
                "✨ ¡Suscripción Confirmada!",
                `<p>✓ Su correo electrónico ha sido añadido con éxito a nuestra base de datos de difusión. Recibirá mensualmente las últimas convocatorias de cursos de Formación Profesional (CP).</p>`
            );
        });
    }
});
