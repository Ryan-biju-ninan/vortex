/**
 * SepsisGuard - Core Logic
 * Handles qSOFA calculation, alerts, and chart visualizations.
 */

// State Management
const appState = {
    readings: [], // Array of { timestamp, rr, sbp, gcs, qsofaScore }
    chart: null
};

// qSOFA Constants
const THRESHOLDS = {
    RR: 22,   // Respiratory Rate >= 22
    SBP: 100, // Systolic BP <= 100
    GCS: 15   // GCS < 15
};

// DOM Elements
const form = document.getElementById('vitals-form');
const scoreDisplay = document.getElementById('score-display');
const riskBadge = document.getElementById('risk-badge');
const alertBox = document.getElementById('alert-box');
const riskReasonsSpy = document.getElementById('risk-reasons');
const btnSimCase1 = document.getElementById('btn-sim-case1');
const btnReset = document.getElementById('btn-reset');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initChart();
});

// --- Logic Functions ---

/**
 * Calculate qSOFA Score (0-3)
 * @param {number} rr - Respiratory Rate
 * @param {number} sbp - Systolic BP
 * @param {number} gcs - Glasgow Coma Scale (number, <13 handled as logic)
 * @returns {object} { score, reasons }
 */
function calculateQSOFA(rr, sbp, gcs) {
    let score = 0;
    let reasons = [];

    if (rr >= THRESHOLDS.RR) {
        score++;
        reasons.push(`Respiratory Rate (${rr}/min) ≥ ${THRESHOLDS.RR}`);
    }

    if (sbp <= THRESHOLDS.SBP) {
        score++;
        reasons.push(`Systolic BP (${sbp} mmHg) ≤ ${THRESHOLDS.SBP}`);
    }

    // GCS < 15 indicates altered mental status
    // Note: Our select input values are strings "15", "14", etc, or "<13"
    // We parse "15" as 15. If value is "<13", we treat it as abnormal (score +1)
    let isAlteredMentalStats = false;
    if (gcs === '<13') {
        isAlteredMentalStats = true;
    } else {
        if (parseInt(gcs) < 15) {
            isAlteredMentalStats = true;
        }
    }

    if (isAlteredMentalStats) {
        score++;
        reasons.push(`Altered Mental Status (GCS < 15)`);
    }

    return { score, reasons };
}

/**
 * Update UI with new reading
 */
function addReading(rr, sbp, gcsVal) {
    const { score, reasons } = calculateQSOFA(rr, sbp, gcsVal);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newReading = {
        timestamp,
        rr,
        sbp,
        gcs: gcsVal, // Keep original string/value for display potential
        qsofaScore: score
    };

    appState.readings.push(newReading);

    // Update UI components
    updateStatusPanel(score, reasons);
    updateChart();

    // Reset form for convenience (optional, maybe keep values for slight edits? Let's reset)
    form.reset();
}

/**
 * Update Status Panel (Score, Badge, Alerts)
 */
function updateStatusPanel(score, reasons) {
    // 1. Score
    scoreDisplay.textContent = score;

    // 2. Class reset
    scoreDisplay.className = 'score-circle';
    riskBadge.className = 'badge';
    alertBox.classList.add('hidden');
    riskReasonsSpy.innerHTML = '';

    // 3. Logic
    if (score >= 2) {
        // High Risk
        scoreDisplay.classList.add('risk-high');
        riskBadge.textContent = 'HIGH RISK';
        riskBadge.classList.add('badge-warning');

        // Show Alert
        alertBox.classList.remove('hidden');
        reasons.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r;
            riskReasonsSpy.appendChild(li);
        });

    } else if (score === 1) {
        // Warning / Med Risk
        scoreDisplay.classList.add('risk-med');
        riskBadge.textContent = 'Monitor Closely';
        riskBadge.classList.add('badge-warning'); // Reuse warning color for med
    } else {
        // Low Risk
        scoreDisplay.classList.add('risk-low');
        riskBadge.textContent = 'Low Risk';
        riskBadge.classList.add('badge-success');
    }
}

// --- Chart.js Setup ---
function initChart() {
    const ctx = document.getElementById('vitalsChart').getContext('2d');

    appState.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'qSOFA Score',
                    data: [],
                    borderColor: '#ef4444', // Red
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    yAxisID: 'y1',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Systolic BP',
                    data: [],
                    borderColor: '#0ea5e9', // Blue
                    backgroundColor: 'transparent',
                    yAxisID: 'y',
                    tension: 0.3,
                    borderDash: [5, 5]
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
                    title: { display: true, text: 'Systolic BP (mmHg)' },
                    min: 50,
                    max: 200
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'qSOFA Score' },
                    min: 0,
                    max: 3,
                    grid: {
                        drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

function updateChart() {
    if (!appState.chart) return;

    // Get last 10 readings to avoid clutter
    const recentReadings = appState.readings.slice(-10);

    appState.chart.data.labels = recentReadings.map(r => r.timestamp);
    appState.chart.data.datasets[0].data = recentReadings.map(r => r.qsofaScore);
    appState.chart.data.datasets[1].data = recentReadings.map(r => r.sbp);

    appState.chart.update();
}

// --- Event Listeners ---

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const rr = parseInt(formData.get('resp-rate'));
    const sbp = parseInt(formData.get('sys-bp'));
    const gcs = formData.get('gcs');

    addReading(rr, sbp, gcs);
});

btnReset.addEventListener('click', () => {
    appState.readings = [];
    updateStatusPanel(0, []);
    updateChart();
    form.reset();
});

// --- Simulation Data ---
const case1Data = [
    { rr: 18, sbp: 120, gcs: '15' }, // Normal
    { rr: 20, sbp: 115, gcs: '15' }, // Stable
    { rr: 23, sbp: 110, gcs: '15' }, // RR spike (Score 1)
    { rr: 25, sbp: 98, gcs: '14' }   // Hypotension + AMS (Score 3 - High Risk)
];

btnSimCase1.addEventListener('click', () => {
    // Clear current
    appState.readings = [];

    // Simulate data entry with delays for dramatic effect
    let i = 0;

    btnSimCase1.disabled = true;
    btnSimCase1.textContent = 'Simulating...';

    const interval = setInterval(() => {
        if (i >= case1Data.length) {
            clearInterval(interval);
            btnSimCase1.disabled = false;
            btnSimCase1.textContent = 'Load Case 1: Risks';
            return;
        }

        const data = case1Data[i];
        addReading(data.rr, data.sbp, data.gcs);

        // Populate form with current simul value just to show what's happening
        document.getElementById('resp-rate').value = data.rr;
        document.getElementById('sys-bp').value = data.sbp;
        document.getElementById('gcs').value = data.gcs;

        i++;
    }, 1500); // Add a reading every 1.5 seconds
});
