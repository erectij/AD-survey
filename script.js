document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('adSurveyForm');
    const sections = Array.from(form.querySelectorAll('.survey-section'));
    const surveyTitle = document.getElementById('surveyTitle');
    const nextButton = document.getElementById('nextButton');
    const prevButton = document.getElementById('prevButton');
    const submitButton = document.getElementById('submitButton');
    
    const completionModal = document.getElementById('completionModal');
    const closeButton = completionModal.querySelector('.close-button');
    const timeTakenSpan = document.getElementById('timeTaken');

    const comorbiditiesSection = document.getElementById('comorbidities_section'); // For skip logic

    let currentSectionIndex = 0;
    let startTime = null;
    let timerStarted = false;
    let surveyStopped = false;

    function toggleElementDisplay(element, show) {
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }

    function updateSurveyTitle() {
        const currentLegend = sections[currentSectionIndex].querySelector('legend');
        if (surveyTitle && currentLegend) {
            surveyTitle.textContent = currentLegend.textContent;
        } else if (surveyTitle) {
            surveyTitle.textContent = "Survey";
        }
    }

    function showSection(index) {
        sections.forEach((section, i) => {
            toggleElementDisplay(section, i === index);
        });
        currentSectionIndex = index;
        updateNavigationButtons();
        updateSurveyTitle();
        window.scrollTo(0, 0);
    }

    function updateNavigationButtons() {
        toggleElementDisplay(prevButton, currentSectionIndex > 0);
        toggleElementDisplay(nextButton, currentSectionIndex < sections.length - 1 && !surveyStopped);
        toggleElementDisplay(submitButton, currentSectionIndex === sections.length - 1 && !surveyStopped);
        
        if (surveyStopped) {
            toggleElementDisplay(nextButton, false);
            toggleElementDisplay(submitButton, false);
        }
    }
    
    function validateCurrentSection() {
        const currentSection = sections[currentSectionIndex];
        const inputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
        for (let input of inputs) {
            if (input.offsetWidth > 0 || input.offsetHeight > 0 || input.getClientRects().length > 0) {
                if (input.type === 'radio' || input.type === 'checkbox') {
                    const name = input.name;
                    if (!currentSection.querySelector(`input[name="${name}"]:checked`)) {
                        alert(`Please answer: ${input.closest('.question-group').querySelector('.main-label').textContent.replace('*','').trim()}`);
                        input.focus();
                        return false;
                    }
                } else if (!input.value || input.value.trim() === "") { // Also check for empty string in selects
                    alert(`Please fill out: ${input.closest('.question-group').querySelector('.main-label').textContent.replace('*','').trim()}`);
                    input.focus();
                    return false;
                }
            }
        }
        return true;
    }

    nextButton.addEventListener('click', () => {
        if (surveyStopped) return;
        if (!validateCurrentSection()) return;

        const currentSectionElement = sections[currentSectionIndex];
        const everTreatedNoRadio = currentSectionElement.querySelector('#ever_treated_ad_no');

        // If on "Treatment Introduction" (index 2) and "No" to ever treated AD
        if (currentSectionIndex === 2 && everTreatedNoRadio && everTreatedNoRadio.checked) {
            showSection(5); // Skip to "Comorbidities" (index 5)
            return;
        }

        if (currentSectionIndex < sections.length - 1) {
            showSection(currentSectionIndex + 1);
        }
    });

    prevButton.addEventListener('click', () => {
        const everTreatedNoRadioGlobal = form.querySelector('#ever_treated_ad_no');

        // If currently on Comorbidities (index 5) AND "ever_treated_ad_no" was checked globally
        if (currentSectionIndex === 5 && everTreatedNoRadioGlobal && everTreatedNoRadioGlobal.checked) {
            showSection(2); // Go back to "Treatment Introduction" (index 2)
            return;
        }
        if (currentSectionIndex > 0) {
            showSection(currentSectionIndex - 1);
        }
    });

    function startTimerIfNeeded() {
        if (!timerStarted && !surveyStopped) {
            startTime = new Date().getTime();
            timerStarted = true;
            console.log('Timer started');
        }
    }
    form.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', startTimerIfNeeded);
        input.addEventListener('change', startTimerIfNeeded);
    });

    function setupSliderSync(sliderId, numberId) {
        const slider = document.getElementById(sliderId);
        const numberInput = document.getElementById(numberId);
        if (slider && numberInput) {
            slider.addEventListener('input', () => numberInput.value = slider.value);
            numberInput.addEventListener('input', () => {
                if (parseFloat(numberInput.value) > parseFloat(slider.max)) numberInput.value = slider.max;
                if (parseFloat(numberInput.value) < parseFloat(slider.min)) numberInput.value = slider.min;
                slider.value = numberInput.value;
            });
             // Initialize number input from slider's current value (which could be default from HTML)
            numberInput.value = slider.value;
        }
    }
    // Background section
    setupSliderSync('age_slider', 'age');
    setupSliderSync('weight_slider', 'weight');
    setupSliderSync('height_slider', 'height');
    // Employment section
    setupSliderSync('work_part_time_percentage_slider', 'work_part_time_percentage');
    // Treatment section
    setupSliderSync('satisfaction_current_treatment_slider', 'satisfaction_current_treatment');
    // Disease Severity
    setupSliderSync('days_symptoms_bothered_slider', 'days_symptoms_bothered');
    setupSliderSync('itch_rating_24h_slider', 'itch_rating_24h');
    setupSliderSync('itch_interfere_sleep_slider', 'itch_interfere_sleep');
    // WPAI sliders
    setupSliderSync('wpai_missed_work_health_slider', 'wpai_missed_work_health');
    setupSliderSync('wpai_missed_work_other_slider', 'wpai_missed_work_other');
    setupSliderSync('wpai_hours_actually_worked_slider', 'wpai_hours_actually_worked');
    setupSliderSync('wpai_productivity_affected_slider', 'wpai_productivity_affected');
    setupSliderSync('wpai_daily_activities_affected_slider', 'wpai_daily_activities_affected');


    const ageInput = document.getElementById('age');
    const ageStopMessage = document.getElementById('age_stop_message');
    if (ageInput) {
        ageInput.addEventListener('change', function() {
            const ageVal = parseInt(this.value);
            if (ageVal < 18 && ageVal >=0) {
                toggleElementDisplay(ageStopMessage, true);
                surveyStopped = true;
            } else {
                toggleElementDisplay(ageStopMessage, false);
                if (surveyStopped && (isNaN(ageVal) || ageVal >= 18) && !(document.getElementById('pregnancy_question_group').style.display === 'block' && form.querySelector('input[name="pregnant"]:checked')?.value === 'yes')) {
                    surveyStopped = false;
                }
            }
            updateNavigationButtons();
        });
    }

    const genderRadios = form.querySelectorAll('input[name="gender"]');
    const pregnancyQuestionGroup = document.getElementById('pregnancy_question_group');
    const pregnantRadios = form.querySelectorAll('input[name="pregnant"]');
    const pregnancyStopMessage = document.getElementById('pregnancy_stop_message');

    genderRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const showPregnancy = this.value === 'female';
            toggleElementDisplay(pregnancyQuestionGroup, showPregnancy);
            if (!showPregnancy) {
                toggleElementDisplay(pregnancyStopMessage, false);
                // Reset pregnancy selection if gender changes from female
                pregnantRadios.forEach(pr => pr.checked = false);
                 if (surveyStopped && (isNaN(parseInt(ageInput.value)) || parseInt(ageInput.value) >= 18) ) {
                    surveyStopped = false;
                 }
            }
             updateNavigationButtons();
        });
    });

    pregnantRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const isPregnantOrLactating = this.value === 'yes';
            toggleElementDisplay(pregnancyStopMessage, isPregnantOrLactating);
            if (isPregnantOrLactating) {
                surveyStopped = true;
            } else {
                if (surveyStopped && (isNaN(parseInt(ageInput.value)) || parseInt(ageInput.value) >= 18)) {
                    surveyStopped = false;
                }
            }
            updateNavigationButtons();
        });
    });
    
    const currentWorkSituation = document.getElementById('current_work_situation');
    if (currentWorkSituation) {
        currentWorkSituation.addEventListener('change', function() {
            toggleElementDisplay(document.getElementById('work_part_time_percentage_group'), this.value === 'part_time');
            toggleElementDisplay(document.getElementById('disability_pension_percentage_group'), this.value === 'partial_disability');
            toggleElementDisplay(document.getElementById('disability_reason_group'), this.value === 'full_disability' || this.value === 'partial_disability');
            toggleElementDisplay(document.getElementById('not_working_reason_group'), this.value === 'not_working');
        });
    }

    const everTreatedAdRadios = form.querySelectorAll('input[name="ever_treated_ad"]');
    const skipTreatmentMessage = document.getElementById('skip_treatment_message');

    everTreatedAdRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            toggleElementDisplay(skipTreatmentMessage, this.value === 'no');
        });
    });

    function setupConditionalMedicationGroup(yesNoRadioName, whichGroupId) {
        const yesNoRadios = form.querySelectorAll(`input[name="${yesNoRadioName}"]`);
        const whichGroup = document.getElementById(whichGroupId);
        
        if (!yesNoRadios.length || !whichGroup) {
            return;
        }

        yesNoRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                toggleElementDisplay(whichGroup, this.value === 'yes');
                if (this.value === 'no') {
                    const checkboxes = whichGroup.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(cb => cb.checked = false);
                }
            });
        });
    }

    // Current Treatments
    setupConditionalMedicationGroup('current_oral_med', 'current_oral_med_which_group');
    setupConditionalMedicationGroup('current_injectable_med', 'current_injectable_med_which_group');
    setupConditionalMedicationGroup('current_topical_med', 'current_topical_med_which_group');

    // Past Treatments
    setupConditionalMedicationGroup('ever_oral_med_past', 'ever_oral_med_which_group');
    setupConditionalMedicationGroup('ever_injectable_med_past', 'ever_injectable_med_which_group');
    setupConditionalMedicationGroup('ever_topical_med_past', 'ever_topical_med_which_group');


    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (surveyStopped) {
            alert("The survey cannot be submitted due to an earlier stop condition.");
            return;
        }
        if (!timerStarted && currentSectionIndex === 0 && !validateCurrentSection()) {
             alert('Please answer at least one question before submitting.');
             return;
        }
         if (!validateCurrentSection()) return;

        const endTime = new Date().getTime();
        const durationMs = endTime - startTime;
        const durationSeconds = Math.round(durationMs / 1000);
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        timeTakenSpan.textContent = formattedTime;
        toggleElementDisplay(completionModal, true);

        console.log(`Survey submitted. Time: ${formattedTime}`);
    });

    closeButton.addEventListener('click', () => {
        toggleElementDisplay(completionModal, false);
    });
    window.addEventListener('click', (event) => {
        if (event.target === completionModal) {
            toggleElementDisplay(completionModal, false);
        }
    });
    
    showSection(0); 
});