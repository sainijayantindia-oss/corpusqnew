/**
 * CorpusQ - Retirement Planning Calculator Core Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const calcForm = document.getElementById('calc-form');
  const currentAgeInput = document.getElementById('current-age');
  const genderSelect = document.getElementById('gender');
  const statusEarning = document.getElementById('status-earning');
  const statusNonEarning = document.getElementById('status-non-earning');
  const earningFields = document.getElementById('earning-fields');
  
  const monthlyIncomeInput = document.getElementById('monthly-income');
  const monthlySipInput = document.getElementById('monthly-sip');
  const totalCorpusInput = document.getElementById('total-corpus');
  const retirementAgeInput = document.getElementById('retirement-age');
  const customExpenseInput = document.getElementById('custom-expense');
  
  // Assumptions
  const assumptionsToggle = document.getElementById('assumptions-toggle');
  const assumptionsSection = assumptionsToggle.parentElement;
  const inflationInput = document.getElementById('inflation');
  const preRetReturnInput = document.getElementById('pre-ret-return');
  const postRetReturnInput = document.getElementById('post-ret-return');
  const healthcareInflationInput = document.getElementById('healthcare-inflation');
  const taxReservePctInput = document.getElementById('tax-reserve-pct');
  const emergencyBufferPctInput = document.getElementById('emergency-buffer-pct');
  const healthcareReservePctInput = document.getElementById('healthcare-reserve-pct');
  const longevityBufferInput = document.getElementById('longevity-buffer');
  const lifeExpMaleInput = document.getElementById('life-exp-male');
  const lifeExpFemaleInput = document.getElementById('life-exp-female');

  // Page View Containers & Wizard Buttons
  const inputsView = document.getElementById('inputs-view');
  const resultsView = document.getElementById('results-view');
  const btnGeneratePlan = document.getElementById('btn-generate-plan');
  const btnBackToInputs = document.getElementById('btn-back-to-inputs');
  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  const btnDownloadText = document.getElementById('btn-download-text');

  // Summary Metrics Sheet Elements (19 metrics)
  const mCurrentAge = document.getElementById('m-current-age');
  const mRetirementAge = document.getElementById('m-retirement-age');
  const mLifeExpectancy = document.getElementById('m-life-expectancy');
  const mYearsRemaining = document.getElementById('m-years-remaining');
  const mCurrentExpense = document.getElementById('m-current-expense');
  const mFutureMonthlyExpense = document.getElementById('m-future-monthly-expense');
  const mFutureAnnualExpense = document.getElementById('m-future-annual-expense');
  const mRequiredCorpus = document.getElementById('m-required-corpus');
  const mHealthcareReserve = document.getElementById('m-healthcare-reserve');
  const mTaxReserve = document.getElementById('m-tax-reserve');
  const mEmergencyBuffer = document.getElementById('m-emergency-buffer');
  const mLongevityBuffer = document.getElementById('m-longevity-buffer');
  const mTotalGoal = document.getElementById('m-total-goal');
  const mCurrentCorpus = document.getElementById('m-current-corpus');
  const mMonthlySip = document.getElementById('m-monthly-sip');
  const mProjectedCorpus = document.getElementById('m-projected-corpus');
  const mRetirementGap = document.getElementById('m-retirement-gap');
  const mRequiredSip = document.getElementById('m-required-sip');
  const mReadinessPct = document.getElementById('m-readiness-pct');
  const mSuccessProb = document.getElementById('m-success-prob');

  // Gauges inside Results View
  const readinessPctText = document.getElementById('readiness-pct-text');
  const readinessStatusLabel = document.getElementById('readiness-status-label');
  const probabilityValueText = document.getElementById('probability-value-text');

  // Interactive Widgets
  const lifestyleBtns = document.querySelectorAll('.lifestyle-btn');
  const aiCoachContent = document.getElementById('ai-coach-content');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const simulationTableBody = document.querySelector('#simulation-table tbody');
  const btnExportCsv = document.getElementById('btn-export-csv');

  // Modals
  const guidelinesModal = document.getElementById('guidelines-modal');
  const btnShowGuidelines = document.getElementById('btn-show-guidelines');
  const linkGuidelines = document.getElementById('link-guidelines');
  const btnCloseGuidelines = document.getElementById('btn-close-guidelines');
  const btnCloseGuidelinesFooter = document.getElementById('btn-close-guidelines-footer');

  // Dark Mode
  const btnDarkMode = document.getElementById('btn-dark-mode');
  const darkModeIcon = document.getElementById('dark-mode-icon');
  let isDarkMode = false;

  // Global variables to store calculation results for report extraction
  let reportData = {};

  // --- Charts Instance Store ---
  let charts = {};

  // --- Initialize Event Listeners ---
  setupEventListeners();

  function setupEventListeners() {
    // Earning / Non-Earning Switch
    statusEarning.addEventListener('change', toggleEmploymentStatus);
    statusNonEarning.addEventListener('change', toggleEmploymentStatus);

    // Form inputs validator trigger
    const inputsToValidate = [currentAgeInput, retirementAgeInput, lifeExpMaleInput, lifeExpFemaleInput];
    inputsToValidate.forEach(input => {
      input.addEventListener('input', validateInputConstraints);
    });

    // Wizard Generation Button
    btnGeneratePlan.addEventListener('click', () => {
      if (calcForm.checkValidity()) {
        calculateRetirement();
        inputsView.classList.remove('active');
        resultsView.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Force charts resize to fit newly visible container
        setTimeout(() => {
          Object.values(charts).forEach(chart => chart.resize());
        }, 100);
      } else {
        calcForm.reportValidity();
      }
    });

    // Modify Inputs Button (Back button)
    btnBackToInputs.addEventListener('click', () => {
      resultsView.classList.remove('active');
      inputsView.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Download PDF Report (via OS print dialog)
    btnDownloadPdf.addEventListener('click', () => {
      window.print();
    });

    // Download Report Summary (formatted markdown document)
    btnDownloadText.addEventListener('click', downloadFormattedReport);

    // Lifestyle Selector Buttons
    lifestyleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        lifestyleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        customExpenseInput.value = btn.dataset.value;
      });
    });

    // Custom Expense updates lifestyle button states
    customExpenseInput.addEventListener('input', () => {
      const val = parseInt(customExpenseInput.value);
      lifestyleBtns.forEach(btn => {
        if (parseInt(btn.dataset.value) === val) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });

    // Accordion Toggle
    assumptionsToggle.addEventListener('click', () => {
      assumptionsSection.classList.toggle('active');
    });

    // Tabs Switch
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        
        if (btn.dataset.tab === 'tab-charts') {
          Object.values(charts).forEach(chart => chart.resize());
        }
      });
    });

    // CSV Export
    btnExportCsv.addEventListener('click', exportSimulationToCSV);

    // Modal Events
    const showModal = () => guidelinesModal.classList.add('active');
    const hideModal = () => guidelinesModal.classList.remove('active');
    btnShowGuidelines.addEventListener('click', showModal);
    linkGuidelines.addEventListener('click', (e) => { e.preventDefault(); showModal(); });
    btnCloseGuidelines.addEventListener('click', hideModal);
    btnCloseGuidelinesFooter.addEventListener('click', hideModal);
    guidelinesModal.addEventListener('click', (e) => {
      if (e.target === guidelinesModal) hideModal();
    });

    // Dark Mode Toggle
    btnDarkMode.addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      document.body.classList.toggle('dark-theme', isDarkMode);
      if (isDarkMode) {
        darkModeIcon.classList.remove('fa-moon');
        darkModeIcon.classList.add('fa-sun');
        btnDarkMode.title = 'Switch to Light Mode';
      } else {
        darkModeIcon.classList.remove('fa-sun');
        darkModeIcon.classList.add('fa-moon');
        btnDarkMode.title = 'Switch to Dark Mode';
      }
      // Re-draw charts after theme change so colors update correctly
      setTimeout(() => { Object.values(charts).forEach(c => c.resize()); }, 50);
    });
  }

  function toggleEmploymentStatus() {
    if (statusEarning.checked) {
      earningFields.classList.add('active');
      if (parseInt(monthlyIncomeInput.value) === 0) monthlyIncomeInput.value = 150000;
      if (parseInt(monthlySipInput.value) === 0) monthlySipInput.value = 30000;
      if (parseInt(totalCorpusInput.value) === 0) totalCorpusInput.value = 1500000;
    } else {
      earningFields.classList.remove('active');
    }
  }

  function validateInputConstraints() {
    const curAge = parseInt(currentAgeInput.value) || 30;
    const retAge = parseInt(retirementAgeInput.value) || 60;
    
    if (retAge <= curAge) {
      retirementAgeInput.setCustomValidity("Retirement age must be greater than current age.");
    } else {
      retirementAgeInput.setCustomValidity("");
    }
  }

  // --- Formatting Helpers ---
  function formatCurrency(val) {
    if (isNaN(val) || val === null) return "₹0";
    
    // Indian formatting
    if (val >= 10000000) {
      return "₹" + (val / 10000000).toFixed(2) + " Cr";
    } else if (val >= 100000) {
      return "₹" + (val / 100000).toFixed(2) + " Lakh";
    } else {
      return "₹" + Math.round(val).toLocaleString('en-IN');
    }
  }

  function formatRawNumber(val) {
    return Math.round(val).toLocaleString('en-IN');
  }

  // Box-Muller transform for normal distribution
  function randNormal(mean, sd) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); 
    while(v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * sd + mean;
  }

  // --- Core Planner Engine ---
  function calculateRetirement() {
    // Inputs extraction
    const currentAge = parseInt(currentAgeInput.value) || 30;
    const gender = genderSelect.value;
    const isEarning = statusEarning.checked;
    
    const monthlyIncome = isEarning ? (parseFloat(monthlyIncomeInput.value) || 0) : 0;
    const monthlySIP = isEarning ? (parseFloat(monthlySipInput.value) || 0) : 0;
    const currentCorpus = isEarning ? (parseFloat(totalCorpusInput.value) || 0) : 0;
    
    const retirementAge = parseInt(retirementAgeInput.value) || 60;
    const customExpense = parseFloat(customExpenseInput.value) || 200000;
    
    // Assumptions
    const inflation = (parseFloat(inflationInput.value) || 6.0) / 100;
    const preRetReturn = (parseFloat(preRetReturnInput.value) || 12.0) / 100;
    const postRetReturn = (parseFloat(postRetReturnInput.value) || 8.0) / 100;
    const healthcareInflation = (parseFloat(healthcareInflationInput.value) || 8.0) / 100;
    const taxReservePct = (parseFloat(taxReservePctInput.value) || 20.0) / 100;
    const emergencyBufferPct = (parseFloat(emergencyBufferPctInput.value) || 5.0) / 100;
    const healthcareReservePct = (parseFloat(healthcareReservePctInput.value) || 10.0) / 100;
    const longevityBufferVal = (parseFloat(longevityBufferInput.value) || 5.0) * 10000000; // in Crores
    
    const lifeExpectancy = gender === 'male' 
      ? (parseInt(lifeExpMaleInput.value) || 85)
      : (parseInt(lifeExpFemaleInput.value) || 88);

    // Step 1: Future Monthly & Annual Expense
    const yearsToRetire = Math.max(0, retirementAge - currentAge);
    const futureMonthlyExpense = customExpense * Math.pow(1 + inflation, yearsToRetire);
    const futureAnnualExpense = futureMonthlyExpense * 12;

    // Step 2: Retirement Duration
    const retirementDuration = Math.max(0, lifeExpectancy - retirementAge);

    // Step 3: Required Retirement Corpus (Real Return Model)
    const realReturn = ((1 + postRetReturn) / (1 + inflation)) - 1;
    let requiredCorpus = 0;
    if (realReturn !== 0) {
      requiredCorpus = futureAnnualExpense * ((1 - Math.pow(1 + realReturn, -retirementDuration)) / realReturn);
    } else {
      requiredCorpus = futureAnnualExpense * retirementDuration;
    }

    // Step 4-7: Reserves
    const healthcareReserve = requiredCorpus * healthcareReservePct;
    const taxReserve = requiredCorpus * taxReservePct;
    const emergencyBuffer = requiredCorpus * emergencyBufferPct;
    const longevityBuffer = longevityBufferVal;

    // Step 8: Total Retirement Goal
    const totalGoal = requiredCorpus + healthcareReserve + taxReserve + emergencyBuffer + longevityBuffer;

    // Step 9: Future Corpus Projection
    const fvExistingCorpus = currentCorpus * Math.pow(1 + preRetReturn, yearsToRetire);
    const monthlyRate = preRetReturn / 12;
    const months = yearsToRetire * 12;
    let fvSIP = 0;
    if (monthlyRate > 0) {
      fvSIP = monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    } else {
      fvSIP = monthlySIP * months;
    }
    const projectedCorpus = fvExistingCorpus + fvSIP;

    // Step 10: Retirement Gap
    const gap = totalGoal - projectedCorpus;

    // Step 11: Required SIP
    let requiredSIP = 0;
    if (projectedCorpus < totalGoal && yearsToRetire > 0) {
      const remainingGoal = totalGoal - fvExistingCorpus;
      if (remainingGoal > 0 && monthlyRate > 0) {
        requiredSIP = remainingGoal * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
      } else {
        requiredSIP = remainingGoal / months;
      }
    }

    // Step 12: Readiness Score
    const readinessPct = totalGoal > 0 ? (projectedCorpus / totalGoal) * 100 : 0;
    let readinessClass = 'Critical';
    let readinessColor = 'var(--color-danger)';
    if (readinessPct >= 100) {
      readinessClass = 'Retirement Ready';
      readinessColor = 'var(--color-success)';
    } else if (readinessPct >= 75) {
      readinessClass = 'Nearly Ready';
      readinessColor = 'var(--color-secondary)';
    } else if (readinessPct >= 50) {
      readinessClass = 'Needs Improvement';
      readinessColor = 'var(--color-warning)';
    }

    // Step 13: Monte Carlo Simulation
    const successProbability = runMonteCarlo(
      currentAge, retirementAge, lifeExpectancy, currentCorpus, monthlySIP, 
      customExpense, preRetReturn, postRetReturn, inflation, totalGoal
    );

    // Save calculation data to global store
    reportData = {
      currentAge, retirementAge, lifeExpectancy, yearsToRetire, currentCorpus,
      monthlySIP, customExpense, futureMonthlyExpense, futureAnnualExpense,
      requiredCorpus, healthcareReserve, taxReserve, emergencyBuffer, longevityBuffer,
      totalGoal, projectedCorpus, gap, requiredSIP, readinessPct, successProbability,
      isEarning, monthlyIncome, gender, inflation: inflation * 100, preRetReturn: preRetReturn * 100,
      postRetReturn: postRetReturn * 100
    };

    // Populate the 19 Summary Metrics Sheet UI
    updateSummarySheetUI();

    // Populate upper gauges
    updateGaugesUI(readinessPct, readinessClass, readinessColor, successProbability);

    // Run Detailed Simulation Trajectory & Update Data Table
    const trajectory = generateDetailedTrajectory(
      currentAge, retirementAge, lifeExpectancy, currentCorpus, monthlySIP, 
      preRetReturn, postRetReturn, inflation, futureAnnualExpense, totalGoal, projectedCorpus
    );
    
    populateSimulationTable(trajectory);

    // Re-draw Charts
    updateCharts(trajectory, requiredCorpus, healthcareReserve, taxReserve, emergencyBuffer, longevityBuffer, totalGoal, projectedCorpus, yearsToRetire, currentAge, retirementAge, lifeExpectancy, customExpense, inflation, successProbability, readinessPct, readinessColor);

    // Generate AI Coach Advisory Recommendations
    generateAICoachAdvice(
      readinessPct, gap, successProbability, monthlySIP, requiredSIP, 
      currentAge, retirementAge, projectedCorpus, totalGoal
    );

    // Save calculation state for CSV export
    window.lastCalculatedTrajectory = trajectory;
  }

  // --- Monte Carlo Simulation Engine ---
  function runMonteCarlo(
    currentAge, retirementAge, lifeExpectancy, currentCorpus, monthlySIP, 
    customExpense, preRetReturn, postRetReturn, inflation, totalGoal
  ) {
    const yearsToRetire = retirementAge - currentAge;
    const baseDuration = lifeExpectancy - retirementAge;
    let successCount = 0;
    const runs = 10000;

    for (let i = 0; i < runs; i++) {
      const randPreReturn = Math.max(0.01, randNormal(preRetReturn, 0.04));
      const randPostReturn = Math.max(0.01, randNormal(postRetReturn, 0.03));
      const randInflation = Math.max(0.01, randNormal(inflation, 0.015));
      const randLifeExpectancy = Math.max(retirementAge + 1, Math.round(randNormal(lifeExpectancy, 4)));
      
      const randRetDuration = randLifeExpectancy - retirementAge;

      // Compounding Pre-Retirement
      let randCorpus = currentCorpus * Math.pow(1 + randPreReturn, yearsToRetire);
      const randMonthlyRate = randPreReturn / 12;
      const randMonths = yearsToRetire * 12;
      if (randMonthlyRate > 0) {
        randCorpus += monthlySIP * ((Math.pow(1 + randMonthlyRate, randMonths) - 1) / randMonthlyRate);
      } else {
        randCorpus += monthlySIP * randMonths;
      }

      // Spend down during retirement
      let currentExpenseYearly = (customExpense * 12) * Math.pow(1 + randInflation, yearsToRetire);
      let survived = true;

      for (let y = 1; y <= randRetDuration; y++) {
        // Withdraw at start of year
        randCorpus -= currentExpenseYearly;
        if (randCorpus < 0) {
          survived = false;
          break;
        }
        // Compounding remaining corpus
        randCorpus = randCorpus * (1 + randPostReturn);
        // Inflate expense for next year
        currentExpenseYearly = currentExpenseYearly * (1 + randInflation);
      }

      if (survived && randCorpus >= 0) {
        successCount++;
      }
    }

    return (successCount / runs) * 100;
  }

  // --- Generate Detailed Simulation Path ---
  function generateDetailedTrajectory(
    currentAge, retirementAge, lifeExpectancy, currentCorpus, monthlySIP, 
    preRetReturn, postRetReturn, inflation, futureAnnualExpense, totalGoal, projectedCorpus
  ) {
    const trajectory = [];
    const yearsToRetire = retirementAge - currentAge;
    const retirementDuration = lifeExpectancy - retirementAge;
    
    let currentPreWealth = currentCorpus;
    let currentPostWealthRequired = totalGoal;
    let currentPostWealthProjected = projectedCorpus;
    
    let annualExpense = futureAnnualExpense;
    
    // Phase 1: Pre-Retirement
    for (let y = 0; y <= yearsToRetire; y++) {
      const age = currentAge + y;
      const calendarYear = new Date().getFullYear() + y;
      
      let sipContribution = 0;
      let growthEarned = 0;
      
      if (y > 0) {
        const prevWealth = trajectory[y - 1].preWealth;
        sipContribution = monthlySIP * 12;
        growthEarned = (prevWealth * preRetReturn) + (sipContribution * (preRetReturn / 2));
        currentPreWealth = prevWealth + sipContribution + growthEarned;
      }
      
      trajectory.push({
        age: age,
        year: calendarYear,
        phase: 'pre',
        preWealth: currentPreWealth,
        postWealthRequired: 0,
        postWealthProjected: 0,
        expense: 0,
        sipContribution: sipContribution,
        growthEarned: growthEarned
      });
    }

    // Phase 2: Post-Retirement
    for (let y = 1; y <= retirementDuration; y++) {
      const age = retirementAge + y;
      const calendarYear = new Date().getFullYear() + yearsToRetire + y;
      
      let prevRequired = y === 1 ? totalGoal : trajectory[trajectory.length - 1].postWealthRequired;
      let prevProjected = y === 1 ? projectedCorpus : trajectory[trajectory.length - 1].postWealthProjected;
      
      let postReqRemaining = Math.max(0, prevRequired - annualExpense);
      let postProjRemaining = Math.max(0, prevProjected - annualExpense);
      
      let growthRequired = postReqRemaining * postRetReturn;
      let growthProjected = postProjRemaining * postRetReturn;
      
      currentPostWealthRequired = postReqRemaining + growthRequired;
      currentPostWealthProjected = postProjRemaining + growthProjected;
      
      trajectory.push({
        age: age,
        year: calendarYear,
        phase: 'post',
        preWealth: 0,
        postWealthRequired: currentPostWealthRequired,
        postWealthProjected: currentPostWealthProjected,
        expense: annualExpense,
        sipContribution: 0,
        growthEarned: growthRequired
      });
      
      annualExpense = annualExpense * (1 + inflation);
    }
    
    return trajectory;
  }

  // --- Populate Summary UI (19 metrics) ---
  function updateSummarySheetUI() {
    mCurrentAge.innerText = reportData.currentAge;
    mRetirementAge.innerText = reportData.retirementAge;
    mLifeExpectancy.innerText = reportData.lifeExpectancy;
    mYearsRemaining.innerText = reportData.yearsToRetire;
    
    mCurrentExpense.innerText = formatCurrency(reportData.customExpense);
    mFutureMonthlyExpense.innerText = formatCurrency(reportData.futureMonthlyExpense);
    mFutureAnnualExpense.innerText = formatCurrency(reportData.futureAnnualExpense);
    
    mRequiredCorpus.innerText = formatCurrency(reportData.requiredCorpus);
    mHealthcareReserve.innerText = formatCurrency(reportData.healthcareReserve);
    mTaxReserve.innerText = formatCurrency(reportData.taxReserve);
    mEmergencyBuffer.innerText = formatCurrency(reportData.emergencyBuffer);
    mLongevityBuffer.innerText = formatCurrency(reportData.longevityBuffer);
    mTotalGoal.innerText = formatCurrency(reportData.totalGoal);
    
    mCurrentCorpus.innerText = formatCurrency(reportData.currentCorpus);
    mMonthlySip.innerText = formatCurrency(reportData.monthlySIP);
    mProjectedCorpus.innerText = formatCurrency(reportData.projectedCorpus);
    
    // Gap / Surplus Highlight
    if (reportData.gap > 0) {
      mRetirementGap.innerText = formatCurrency(reportData.gap);
      mRetirementGap.className = 's-val text-danger';
      mRequiredSip.innerText = formatCurrency(reportData.requiredSIP);
      mRequiredSip.className = 's-val text-danger font-semibold';
    } else {
      mRetirementGap.innerText = "+" + formatCurrency(Math.abs(reportData.gap));
      mRetirementGap.className = 's-val text-success';
      mRequiredSip.innerText = "₹0 (Fully Funded)";
      mRequiredSip.className = 's-val text-success font-semibold';
    }
    
    mReadinessPct.innerText = reportData.readinessPct.toFixed(1) + "%";
    mReadinessPct.className = 's-val font-bold ' + 
      (reportData.readinessPct >= 100 ? 'text-success' : (reportData.readinessPct >= 75 ? 'text-primary' : (reportData.readinessPct >= 50 ? 'text-warning' : 'text-danger')));
    
    mSuccessProb.innerText = reportData.successProbability.toFixed(0) + "%";
    mSuccessProb.className = 's-val font-bold ' +
      (reportData.successProbability >= 80 ? 'text-success' : (reportData.successProbability >= 50 ? 'text-warning' : 'text-danger'));
  }

  // --- Populate Gauges UI ---
  function updateGaugesUI(readinessPct, readinessClass, readinessColor, successProbability) {
    // Readiness Gauge
    readinessPctText.innerText = readinessPct.toFixed(0) + "%";
    readinessStatusLabel.innerText = readinessClass;
    readinessStatusLabel.className = 'badge';
    
    if (readinessClass === 'Retirement Ready') {
      readinessStatusLabel.classList.add('badge-accent');
      readinessPctText.style.color = 'var(--color-secondary)';
    } else if (readinessClass === 'Nearly Ready') {
      readinessStatusLabel.style.backgroundColor = 'var(--color-secondary)';
      readinessStatusLabel.style.color = '#FFFFFF';
      readinessPctText.style.color = 'var(--color-secondary)';
    } else if (readinessClass === 'Needs Improvement') {
      readinessStatusLabel.style.backgroundColor = 'var(--color-warning)';
      readinessStatusLabel.style.color = '#FFFFFF';
      readinessPctText.style.color = 'var(--color-warning)';
    } else {
      readinessStatusLabel.style.backgroundColor = 'var(--color-danger)';
      readinessStatusLabel.style.color = '#FFFFFF';
      readinessPctText.style.color = 'var(--color-danger)';
    }

    // Success Gauge
    probabilityValueText.innerText = successProbability.toFixed(0) + "%";
  }

  // --- Populate Simulation Log Table ---
  function populateSimulationTable(trajectory) {
    simulationTableBody.innerHTML = '';
    
    trajectory.forEach(row => {
      const tr = document.createElement('tr');
      
      const preWealthStr = row.phase === 'pre' ? formatRawNumber(row.preWealth) : '-';
      const postWealthStr = row.phase === 'post' ? formatRawNumber(row.postWealthProjected) : '-';
      const expenseStr = row.phase === 'post' ? formatRawNumber(row.expense) : '-';
      const sipStr = row.phase === 'pre' && row.sipContribution > 0 ? formatRawNumber(row.sipContribution) : '-';
      const growthStr = formatRawNumber(row.growthEarned);

      tr.innerHTML = `
        <td><strong>${row.age}</strong></td>
        <td>${row.year}</td>
        <td>${preWealthStr}</td>
        <td class="${row.phase === 'post' && row.postWealthProjected === 0 ? 'text-danger' : ''}">${postWealthStr}</td>
        <td class="text-danger">${expenseStr}</td>
        <td class="text-success">${sipStr}</td>
        <td class="text-success">${growthStr}</td>
      `;
      simulationTableBody.appendChild(tr);
    });
  }

  // --- Generate AI Coach recommendations ---
  function generateAICoachAdvice(readinessPct, gap, successProbability, monthlySIP, requiredSIP, currentAge, retirementAge, projectedCorpus, totalGoal) {
    aiCoachContent.innerHTML = '';
    const adviceList = [];

    // General assessment
    if (readinessPct >= 100) {
      adviceList.push({
        title: 'Retirement Strategy Secure',
        desc: `Excellent planning! Your projected corpus is <strong>${readinessPct.toFixed(0)}%</strong> of your target goal. You are completely on track to retire at ${retirementAge}.`,
        icon: 'fa-circle-check',
        color: 'var(--color-secondary)'
      });
    } else if (readinessPct >= 75) {
      adviceList.push({
        title: 'Highly Approaching Goal',
        desc: `Your retirement readiness is <strong>${readinessPct.toFixed(0)}%</strong>. With mild tweaks, you will reach complete security. Your current gap is ${formatCurrency(gap)}.`,
        icon: 'fa-circle-info',
        color: 'var(--color-secondary)'
      });
    } else {
      adviceList.push({
        title: 'Retirement Shortfall Alert',
        desc: `Your readiness is currently <strong>${readinessPct.toFixed(0)}%</strong>. This indicates a significant savings gap of ${formatCurrency(gap)} at your target age of ${retirementAge}.`,
        icon: 'fa-triangle-exclamation',
        color: 'var(--color-danger)'
      });
    }

    // SIP action plan
    if (gap > 0) {
      adviceList.push({
        title: 'Increase Monthly Investment',
        desc: `Increasing your monthly SIP from <strong>${formatCurrency(monthlySIP)}</strong> to <strong>${formatCurrency(monthlySIP + requiredSIP)}</strong> closes the gap.`,
        icon: 'fa-circle-arrow-up',
        color: 'var(--color-primary)'
      });
      adviceList.push({
        title: 'Consider Annual SIP Step-up',
        desc: 'If raising the SIP immediately is difficult, establish an annual step-up of 10% to progressively cover the deficit.',
        icon: 'fa-chart-line',
        color: 'var(--color-secondary)'
      });
    } else {
      adviceList.push({
        title: 'Growth Optimization Plan',
        desc: 'Since you are ahead of your goal, you can afford to lock in gains by reducing high-equity risk portfolios earlier.',
        icon: 'fa-circle-chevron-down',
        color: 'var(--color-secondary)'
      });
    }

    // Equity and growth recommendations
    if (currentAge < 45) {
      adviceList.push({
        title: 'Leverage High-Equity Allocation',
        desc: `At age ${currentAge}, you have a long runway. A recommended allocation of <strong>80% Equity</strong> helps harness maximum compound growth before retirement.`,
        icon: 'fa-percent',
        color: 'var(--color-primary)'
      });
    } else {
      adviceList.push({
        title: 'Asset Protection Active',
        desc: `As you are ${currentAge}, start moving towards debt asset categories to protect capital from volatility spikes near retirement.`,
        icon: 'fa-shield-halved',
        color: 'var(--color-secondary)'
      });
    }

    // Monte Carlo safety commentary
    if (successProbability >= 85) {
      adviceList.push({
        title: 'High Probability of Longevity Survival',
        desc: `Your <strong>${successProbability.toFixed(0)}%</strong> success probability confirms your plan resists market volatility and inflation shocks extremely well.`,
        icon: 'fa-gauge-high',
        color: 'var(--color-success)'
      });
    } else if (successProbability >= 50) {
      adviceList.push({
        title: 'Medium Market Volatility Risk',
        desc: `A success rate of <strong>${successProbability.toFixed(0)}%</strong> indicates vulnerability to poor market sequences. Enhance debt cushion buffers.`,
        icon: 'fa-triangle-exclamation',
        color: 'var(--color-warning)'
      });
    } else {
      adviceList.push({
        title: 'Critical Failure Risk in Retirement',
        desc: `Success rate is only <strong>${successProbability.toFixed(0)}%</strong>. High chance of early depletion. You must raise savings rate or delay retirement.`,
        icon: 'fa-skull-crossbones',
        color: 'var(--color-danger)'
      });
    }

    // Buffer awareness
    adviceList.push({
      title: 'Reserves Allocation Safety Net',
      desc: `Your strategy locks in <strong>35% in contingency reserves</strong> (Healthcare, Emergency, and Tax) above your required corpus, preserving capital.`,
      icon: 'fa-briefcase-medical',
      color: 'var(--color-primary)'
    });

    // Populate advice list into UI
    adviceList.forEach(item => {
      const rec = document.createElement('div');
      rec.className = 'ai-recommendation-item';
      rec.innerHTML = `
        <i class="fa-solid ${item.icon} ai-rec-icon" style="color: ${item.color}"></i>
        <div class="ai-rec-text">
          <strong>${item.title}</strong>
          ${item.desc}
        </div>
      `;
      aiCoachContent.appendChild(rec);
    });
  }

  // --- Charts Visualizations Draw & Update ---
  function updateCharts(trajectory, requiredCorpus, healthcareReserve, taxReserve, emergencyBuffer, longevityBuffer, totalGoal, projectedCorpus, yearsToRetire, currentAge, retirementAge, lifeExpectancy, customExpense, inflation, successProbability, readinessPct, readinessColor) {
    
    // --- 1. Gauge: Readiness Doughnut Gauge ---
    drawHalfDoughnutGauge('readiness-gauge-chart', readinessPct, readinessColor);

    // --- 2. Gauge: Monte Carlo Probability Gauge ---
    const probColor = successProbability >= 80 ? 'var(--color-success)' : (successProbability >= 50 ? 'var(--color-warning)' : 'var(--color-danger)');
    drawHalfDoughnutGauge('probability-gauge-chart', successProbability, probColor);

    // --- 3. Line Chart: Wealth Growth & Target Projection ---
    const agesPre = trajectory.filter(r => r.phase === 'pre').map(r => r.age);
    const preWealthVals = trajectory.filter(r => r.phase === 'pre').map(r => r.preWealth);
    
    const targetPathVals = agesPre.map((age, idx) => {
      const progress = idx / (agesPre.length - 1);
      const startVal = preWealthVals[0];
      return startVal + (totalGoal - startVal) * progress;
    });

    drawChart('wealth-growth-chart', {
      type: 'line',
      data: {
        labels: agesPre,
        datasets: [
          {
            label: 'Projected Wealth Accumulation (Current SIP)',
            data: preWealthVals,
            borderColor: '#00B4A6',
            backgroundColor: 'rgba(0, 180, 166, 0.05)',
            fill: true,
            tension: 0.1,
            borderWidth: 3
          },
          {
            label: 'Target Trajectory to reach Goal',
            data: targetPathVals,
            borderColor: '#005B66',
            borderDash: [5, 5],
            fill: false,
            tension: 0,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Inter' } } }
        },
        scales: {
          y: {
            ticks: { callback: value => formatCurrency(value) }
          }
        }
      }
    });

    // --- 4. Pie Chart: Target Goal Breakdown ---
    drawChart('corpus-breakdown-chart', {
      type: 'doughnut',
      data: {
        labels: ['Core Required Corpus', 'Healthcare Reserve', 'Tax Reserve', 'Emergency Buffer', 'Longevity Buffer'],
        datasets: [{
          data: [requiredCorpus, healthcareReserve, taxReserve, emergencyBuffer, longevityBuffer],
          backgroundColor: [
            '#005B66', // Core Required
            '#00B4A6', // Healthcare
            '#4F46E5', // Tax Reserve
            '#FFD24A', // Emergency
            '#EC4899'  // Longevity
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { font: { family: 'Inter' } } }
        }
      }
    });

    // --- 5. Bar Chart: Required vs Projected ---
    drawChart('comparison-bar-chart', {
      type: 'bar',
      data: {
        labels: ['Target Goal', 'Projected Corpus'],
        datasets: [{
          label: 'Corpus (₹)',
          data: [totalGoal, projectedCorpus],
          backgroundColor: ['#005B66', '#00B4A6'],
          borderRadius: 6,
          barThickness: 45
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            ticks: { callback: value => formatCurrency(value) }
          }
        }
      }
    });

    // --- 6. Line Chart: Post-Retirement Depletion ---
    // Required path: Shows how the Total Retirement Goal would deplete at avg (life expectancy) age
    // Projected path: Shows actual projected corpus depletion
    const postRows = trajectory.filter(r => r.phase === 'post');
    const agesPost = postRows.map(r => r.age);
    const requiredDepVals = postRows.map(r => r.postWealthRequired);
    const projectedDepVals = postRows.map(r => r.postWealthProjected);

    const firstPostAge = retirementAge;
    const initialReq = totalGoal;
    const initialProj = projectedCorpus;

    // Build annotation: mark life expectancy point on required path
    // Show avg age line vertical annotation (via dataset point)
    const reqDataWithLifeExpMark = [initialReq, ...requiredDepVals];
    const projDataWithZero = [initialProj, ...projectedDepVals];

    drawChart('depletion-chart', {
      type: 'line',
      data: {
        labels: [firstPostAge, ...agesPost],
        datasets: [
          {
            label: 'Total Retirement Goal Depletion (Required Path)',
            data: reqDataWithLifeExpMark,
            borderColor: '#005B66',
            borderDash: [5, 5],
            fill: false,
            tension: 0.1,
            borderWidth: 2.5,
            pointRadius: (ctx) => ctx.dataIndex === reqDataWithLifeExpMark.length - 1 ? 8 : 3,
            pointBackgroundColor: (ctx) => ctx.dataIndex === reqDataWithLifeExpMark.length - 1 ? '#EF4444' : '#005B66',
            pointStyle: (ctx) => ctx.dataIndex === reqDataWithLifeExpMark.length - 1 ? 'rectRot' : 'circle'
          },
          {
            label: 'Projected Corpus Path (Your Current Plan)',
            data: projDataWithZero,
            borderColor: '#FFD24A',
            backgroundColor: 'rgba(255, 210, 74, 0.07)',
            fill: true,
            tension: 0.1,
            borderWidth: 3,
            pointRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                let label = ctx.dataset.label || '';
                return `${label}: ${formatCurrency(ctx.parsed.y)}`;
              },
              afterBody: (items) => {
                const idx = items[0]?.dataIndex;
                const labels = [firstPostAge, ...agesPost];
                if (idx !== undefined && labels[idx] === lifeExpectancy) {
                  return ['⚠ Life Expectancy Reached — Target fully depleted'];
                }
                return [];
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Age (Years)' }
          },
          y: {
            ticks: { callback: value => formatCurrency(value) },
            title: { display: true, text: 'Corpus Value (₹)' }
          }
        }
      }
    });

    // --- 9. Line Chart: Conditional Life Expectancy Trends ---
    drawLifeExpectancyChart(retirementAge, lifeExpectancy);

    // --- 7. Line Chart: Inflation Impact Chart ---
    const yearsArray = Array.from({ length: yearsToRetire + (lifeExpectancy - retirementAge) + 1 }, (_, i) => i);
    const purchasingPowerVals = yearsArray.map(y => 100000 * Math.pow(1 - inflation, y));
    const lifestyleExpensesVals = yearsArray.map(y => customExpense * Math.pow(1 + inflation, y));
    const labelAges = yearsArray.map(y => currentAge + y);

    drawChart('inflation-impact-chart', {
      type: 'line',
      data: {
        labels: labelAges,
        datasets: [
          {
            label: 'Purchasing Power of ₹1 Lakh (Declining)',
            data: purchasingPowerVals,
            borderColor: '#EF4444',
            borderWidth: 2.5,
            fill: false,
            tension: 0.1,
            yAxisID: 'y'
          },
          {
            label: 'Inflated Lifestyle Monthly Expense (Rising)',
            data: lifestyleExpensesVals,
            borderColor: '#005B66',
            borderWidth: 2.5,
            fill: false,
            tension: 0.1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: { callback: value => formatCurrency(value) },
            title: { display: true, text: 'Purchasing Power (₹)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: value => formatCurrency(value) },
            title: { display: true, text: 'Expense Level (₹/mo)' }
          }
        }
      }
    });

    // --- 8. Bar Chart: Recommended Asset Allocation Path ---
    const agesList = [25, 35, 45, 55, 60, 70];
    const equityData = [80, 70, 60, 50, 40, 30];
    const debtData = [15, 20, 30, 40, 50, 60];
    const goldData = [5, 10, 10, 10, 10, 10];

    drawChart('asset-allocation-chart', {
      type: 'bar',
      data: {
        labels: agesList.map(a => `Age ${a}`),
        datasets: [
          {
            label: 'Equity',
            data: equityData,
            backgroundColor: '#00B4A6'
          },
          {
            label: 'Debt',
            data: debtData,
            backgroundColor: '#005B66'
          },
          {
            label: 'Gold / Alternatives',
            data: goldData,
            backgroundColor: '#FFD24A'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true, max: 100 }
        }
      }
    });
  }

  // --- Life Expectancy Trends Chart ---
  function drawLifeExpectancyChart(userRetirementAge, userLifeExpectancy) {
    // Conditional life expectancy data for India (actuarial approximation)
    // Format: [survivalAge, maleRemainingYears, femaleRemainingYears]
    const survivalAges = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
    // Expected age of death = survivalAge + remaining years (approximated from Indian life tables)
    const maleExpectedDeath   = [68, 70, 70.5, 71, 71.5, 72, 72.5, 73.5, 74.5, 76, 77.5, 79, 81, 82.5, 84, 86, 88, 90, 92];
    const femaleExpectedDeath = [71, 73, 73.5, 74, 74.5, 75, 75.5, 76.5, 78, 80, 81.5, 83, 85, 86.5, 88, 90, 92, 93.5, 95];

    drawChart('life-expectancy-chart', {
      type: 'line',
      data: {
        labels: survivalAges,
        datasets: [
          {
            label: 'Male — Expected Age of Death (if survived to this age)',
            data: maleExpectedDeath,
            borderColor: '#005B66',
            backgroundColor: 'rgba(0, 91, 102, 0.06)',
            fill: true,
            tension: 0.3,
            borderWidth: 2.5,
            pointRadius: 3
          },
          {
            label: 'Female — Expected Age of Death (if survived to this age)',
            data: femaleExpectedDeath,
            borderColor: '#EC4899',
            backgroundColor: 'rgba(236, 72, 153, 0.06)',
            fill: true,
            tension: 0.3,
            borderWidth: 2.5,
            pointRadius: 3
          },
          {
            label: `Your Retirement Age (${userRetirementAge})`,
            data: survivalAges.map(() => null),  // Invisible dataset for legend
            borderColor: '#FFD24A',
            borderWidth: 0,
            pointRadius: 0,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 } } },
          tooltip: {
            callbacks: {
              title: (items) => `Survived to Age: ${items[0].label}`,
              label: (ctx) => {
                if (ctx.datasetIndex <= 1) {
                  const remaining = ctx.parsed.y - parseInt(ctx.label);
                  return `${ctx.dataset.label.split('—')[0].trim()}: Expected death at ${ctx.parsed.y} (${remaining} more years)`;
                }
              }
            }
          },
          annotation: {
            // Can be extended with chartjs-plugin-annotation if needed
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Current Survival Age', font: { size: 11 } },
            ticks: { font: { size: 10 } }
          },
          y: {
            title: { display: true, text: 'Expected Final Age (Years)', font: { size: 11 } },
            min: 65,
            max: 100,
            ticks: { font: { size: 10 } }
          }
        }
      }
    });
  }

  // --- Gauge Rendering Utility ---
  function drawHalfDoughnutGauge(canvasId, pct, color) {
    const value = Math.min(100, Math.max(0, pct));
    drawChart(canvasId, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [value, 100 - value],
          backgroundColor: [color, 'rgba(0, 0, 0, 0.05)'],
          borderWidth: 0
        }]
      },
      options: {
        rotation: -90,
        circumference: 180,
        cutout: '80%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
  }

  // --- Chart drawing/replacing wrapper ---
  function drawChart(canvasId, config) {
    if (charts[canvasId]) {
      charts[canvasId].destroy();
    }
    const ctx = document.getElementById(canvasId).getContext('2d');
    charts[canvasId] = new Chart(ctx, config);
  }

  // --- Download Formatted Report as Markdown File ---
  function downloadFormattedReport() {
    if (!reportData.totalGoal) return;

    let r = reportData;
    let mdContent = `# CorpusQ Financial Advisory Report
Generated on: ${new Date().toLocaleDateString('en-IN')}

----------------------------------------------------------------------
## 1. Executive Summary
- **Retirement Readiness Score**: ${r.readinessPct.toFixed(1)}% (${r.readinessPct >= 100 ? 'Retirement Ready' : (r.readinessPct >= 75 ? 'Nearly Ready' : (r.readinessPct >= 50 ? 'Needs Improvement' : 'Critical Shortfall'))})
- **Monte Carlo Success Probability**: ${r.successProbability.toFixed(0)}% (10,000 runs)
- **Retirement Gap / Surplus**: ${r.gap > 0 ? 'Shortfall of ' + formatCurrency(r.gap) : 'Surplus of ' + formatCurrency(Math.abs(r.gap))}
- **Additional Monthly SIP Required**: ${r.gap > 0 ? formatCurrency(r.requiredSIP) : '₹0 (Fully Funded)'}

----------------------------------------------------------------------
## 2. Profile Details & Assumptions
- **Current Age**: ${r.currentAge} years
- **Retirement Age**: ${r.retirementAge} years
- **Life Expectancy**: ${r.lifeExpectancy} years
- **Planning Window**: ${r.yearsToRetire} years remaining to build wealth
- **Assumed General Inflation**: ${r.inflation.toFixed(1)}% per annum
- **Pre-Retirement Investment Return**: ${r.preRetReturn.toFixed(1)}% per annum
- **Post-Retirement Investment Return**: ${r.postRetReturn.toFixed(1)}% per annum

----------------------------------------------------------------------
## 3. Lifestyle & Target expenses
- **Target Monthly Expense (Today's Value)**: ${formatCurrency(r.customExpense)}/month
- **Inflated Monthly Expense (At Retirement)**: ${formatCurrency(r.futureMonthlyExpense)}/month
- **Inflated Annual Expense (First Retirement Year)**: ${formatCurrency(r.futureAnnualExpense)}/year
- **Retirement Phase Duration**: ${r.lifeExpectancy - r.retirementAge} years

----------------------------------------------------------------------
## 4. Total Retirement Goal Breakdown
- **Core required Retirement Corpus**: ${formatCurrency(r.requiredCorpus)}
- **Healthcare Contingency Reserve (10%)**: ${formatCurrency(r.healthcareReserve)}
- **Estimated Tax Reserve (20%)**: ${formatCurrency(r.taxReserve)}
- **Emergency Buffer Reserve (5%)**: ${formatCurrency(r.emergencyBuffer)}
- **Longevity Buffer (Fixed Reserve)**: ${formatCurrency(r.longevityBuffer)}
- **TOTAL RETIREMENT GOAL TARGET**: ${formatCurrency(r.totalGoal)}

----------------------------------------------------------------------
## 5. Current Plan Projection
- **Current Corpus Accumulation**: ${formatCurrency(r.currentCorpus)}
- **Current Monthly SIP Savings**: ${formatCurrency(r.monthlySIP)}/month
- **Projected Wealth at Retirement**: ${formatCurrency(r.projectedCorpus)}

----------------------------------------------------------------------
## 6. AI Coach Recommendations
`;

    // Extract recommendations manually based on data state
    if (r.gap > 0) {
      mdContent += `- [ACTION REQUIRED] You face a retirement shortfall of ${formatCurrency(r.gap)}. Increase your monthly investment immediately by ${formatCurrency(r.requiredSIP)} to keep your plans on track.\n`;
      mdContent += `- [STEP-UP STRATEGY] Implement a 10% annual SIP step-up to ease into the increased savings rate over time.\n`;
    } else {
      mdContent += `- [STRATEGY SECURE] You are fully funded! Keep your current SIP active. You can start locking in gains by migrating assets to debt shields.\n`;
    }

    if (r.currentAge < 45) {
      mdContent += `- [ASSET ALLOCATION] With ${r.yearsToRetire} years remaining, maintain an 80% Equity and 20% Debt allocation to optimize pre-retirement compounding.\n`;
    } else {
      mdContent += `- [RISK MITIGATION] Begin moving a portion of your portfolio towards high-quality short-term debt instruments to protect your corpus from market downturns.\n`;
    }

    mdContent += `
----------------------------------------------------------------------
This report is for educational purposes only and does not constitute formal tax or investment advice.
Generated by CorpusQ: from investment to retirement.
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CorpusQ_Retirement_Planning_Report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Export simulation log to CSV file ---
  function exportSimulationToCSV() {
    const trajectory = window.lastCalculatedTrajectory;
    if (!trajectory || trajectory.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Age,Calendar Year,Phase,Pre-Retirement Wealth (INR),Post-Retirement Wealth (INR),Annual Expense (INR),SIP Contribution (INR),Growth Earned (INR)\r\n";

    trajectory.forEach(row => {
      const line = [
        row.age,
        row.year,
        row.phase,
        Math.round(row.preWealth),
        Math.round(row.postWealthProjected),
        Math.round(row.expense),
        Math.round(row.sipContribution),
        Math.round(row.growthEarned)
      ].join(",");
      csvContent += line + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CorpusQ_Retirement_Simulation_Log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});
