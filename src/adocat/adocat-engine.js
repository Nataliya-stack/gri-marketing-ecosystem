import { createClient } from '@supabase/supabase-js';
import { QUIZ_QUESTIONS } from './adocat-data.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class QuizEngine {
    constructor(uiElements) {
        this.ui = uiElements;
        this.currentIndex = 0;
        this.responses = {};
    }

    start = () => {
        this.ui.welcomeScreen.classList.add('hidden');
        this.ui.quizFlowContainer.classList.remove('hidden');
        this.restoreSession();
        this.renderStep();
    };

    updateProgress = () => {
        const totalSteps = QUIZ_QUESTIONS.length + 1;
        const percent = ((this.currentIndex + 1) / totalSteps) * 100;
        
        // Управляем прогресс-баром через чистую CSS-переменную, дизайн которой лежит в style.css
        this.ui.progressBar.style.setProperty('--quiz-progress', `${percent}%`);
        
        this.ui.stepCounter.textContent = this.currentIndex < QUIZ_QUESTIONS.length 
            ? `${this.currentIndex + 1} / ${QUIZ_QUESTIONS.length}` 
            : 'Paso final';
    };

    renderStep = () => {
        if (this.currentIndex >= QUIZ_QUESTIONS.length) {
            this.revealForm();
            return;
        }

        const data = QUIZ_QUESTIONS[this.currentIndex];
        const cardClone = this.ui.questionTemplate.content.cloneNode(true);
        const cardDiv = cardClone.querySelector('.quiz-card');
        const title = cardClone.querySelector('.question-title');
        const grid = cardClone.querySelector('.options-grid');

        title.textContent = data.text;

        // Вместо жестких классов используем атрибут данных для сетки вариантов
        grid.setAttribute('data-options-count', data.options.length);

        data.options.forEach(option => {
            const btnClone = this.ui.buttonTemplate.content.cloneNode(true);
            const btn = btnClone.querySelector('button');
            btn.textContent = option;

            btn.addEventListener('click', () => this.handleAnswer(cardDiv, btn, data.id, option));
            grid.appendChild(btnClone);
        });

        this.ui.stepsHolder.appendChild(cardClone);
        
        setTimeout(() => {
            cardDiv.classList.remove('opacity-0', 'scale-95');
            cardDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);

        this.updateProgress();
    };

    handleAnswer = (cardDiv, btn, questionId, value) => {
        this.responses[questionId] = value;
        localStorage.setItem('adocat_answers', JSON.stringify(this.responses));

        // Полностью убрали захардкоженные CSS-классы!
        // Логика просто выставляет атрибуты состояния, а визуализацию берет на себя CSS
        cardDiv.querySelectorAll('button').forEach(b => {
            if (b === btn) {
                b.setAttribute('data-selected', 'true');
            } else {
                b.setAttribute('disabled', 'true');
            }
        });

        this.currentIndex++;
        this.renderStep();
    };

    revealForm = () => {
        this.ui.stepCardForm.classList.remove('hidden');
        setTimeout(() => {
            this.ui.stepCardForm.classList.remove('opacity-0');
            this.ui.stepCardForm.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);
        this.updateProgress();
    };

    openModal = (title, htmlContent) => {
        const titleElement = document.getElementById('cta-modal-title');
        const textElement = document.getElementById('cta-modal-text');

        if (titleElement && textElement && this.ui.ctaModal && this.ui.ctaModalCard) {
            titleElement.textContent = title;
            textElement.innerHTML = htmlContent;
            this.ui.ctaModal.classList.remove('opacity-0', 'pointer-events-none');
            this.ui.ctaModalCard.classList.remove('scale-95');
        }
    };

    closeModal = () => {
        if (this.ui.ctaModal && this.ui.ctaModalCard) {
            this.ui.ctaModal.classList.add('opacity-0', 'pointer-events-none');
            this.ui.ctaModalCard.classList.add('scale-95');
        }
    };

    syncWithDatabase = async (e) => {
        e.preventDefault();

        try {
            const { error } = await supabase
                .from('leads')
                .insert([
                    {
                        nombre: this.ui.inputNombre.value,
                        email: this.ui.inputEmail.value,
                        telefono: this.ui.inputTelefono.value,
                        app_origen: 'adocat',
                        respuestas: this.responses
                    }
                ]);

            if (error) throw error;

            localStorage.removeItem('adocat_answers');

            this.ui.stepCardForm.classList.add('hidden');
            this.ui.stepCardSuccess.classList.remove('hidden');
            setTimeout(() => this.ui.stepCardSuccess.classList.remove('opacity-0'), 50);
            this.ui.stepCardSuccess.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            console.log('🚀 Class Engine: Lead successfully synced with cloud.');

        } catch (err) {
            console.error('Database error:', err.message);
            alert('Hubo un problema al enviar los datos.');
        }
    };

    restoreSession = () => {
        const cache = localStorage.getItem('adocat_answers');
        if (cache) {
            this.responses = JSON.parse(cache);
            this.currentIndex = Object.keys(this.responses).length;
            console.log('📦 Session restored successfully. Current Index:', this.currentIndex);
        }
    };
}
