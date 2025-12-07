// DOM Elements
const loadingState = document.getElementById('loadingState');
const jokeCard = document.getElementById('jokeCard');
const errorState = document.getElementById('errorState');
const jokeType = document.getElementById('jokeType');
const jokeSetup = document.getElementById('jokeSetup');
const jokePunchline = document.getElementById('jokePunchline');
const revealBtn = document.getElementById('revealBtn');
const copyBtn = document.getElementById('copyBtn');
const getJokeBtn = document.getElementById('getJokeBtn');
const retryBtn = document.getElementById('retryBtn');
const categorySelect = document.getElementById('category');
const jokeCountEl = document.getElementById('jokeCount');
const categoryCountEl = document.getElementById('categoryCount');
const toast = document.getElementById('toast');

// App State
let state = {
    jokeCount: 0,
    categoriesSeen: new Set(),
    currentJoke: null
};

// API Configuration
const API_BASE_URL = 'https://v2.jokeapi.dev/joke';
const BLACKLIST_FLAGS = 'nsfw,religious,political,racist,sexist,explicit';

// Initialize the app
function init() {
    loadStateFromStorage();
    setupEventListeners();
    fetchJoke();
}

// Event Listeners
function setupEventListeners() {
    getJokeBtn.addEventListener('click', fetchJoke);
    retryBtn.addEventListener('click', fetchJoke);
    revealBtn.addEventListener('click', revealPunchline);
    copyBtn.addEventListener('click', copyJokeToClipboard);
    categorySelect.addEventListener('change', fetchJoke);
}

// Fetch joke from API
async function fetchJoke() {
    showLoading();
    hideError();
    hideJokeCard();

    const category = categorySelect.value;
    
    try {
        const url = `${API_BASE_URL}/${category}?blacklistFlags=${BLACKLIST_FLAGS}&type=twopart`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message);
        }
        
        displayJoke(data);
        updateStats(data);
        saveStateToStorage();
        
    } catch (error) {
        console.error('Error fetching joke:', error);
        showError();
    }
}

// Display the joke
function displayJoke(jokeData) {
    state.currentJoke = jokeData;
    
    jokeType.textContent = jokeData.category || 'Any';
    jokeSetup.textContent = jokeData.setup;
    jokePunchline.textContent = jokeData.delivery;
    jokePunchline.classList.remove('revealed');
    
    revealBtn.disabled = false;
    copyBtn.disabled = false;
    
    hideLoading();
    showJokeCard();
}

// Reveal punchline
function revealPunchline() {
    jokePunchline.classList.add('revealed');
    revealBtn.disabled = true;
}

// Copy joke to clipboard
async function copyJokeToClipboard() {
    if (!state.currentJoke) return;
    
    const jokeText = `${state.currentJoke.setup}\n\n${state.currentJoke.delivery}`;
    
    try {
        await navigator.clipboard.writeText(jokeText);
        showToast('Joke copied to clipboard! 📋');
    } catch (err) {
        console.error('Failed to copy joke:', err);
        showToast('Failed to copy joke 😞');
    }
}

// Update statistics
function updateStats(jokeData) {
    state.jokeCount++;
    state.categoriesSeen.add(jokeData.category);
    
    jokeCountEl.textContent = state.jokeCount;
    categoryCountEl.textContent = state.categoriesSeen.size;
}

// Show/hide states
function showLoading() {
    loadingState.classList.add('active');
}

function hideLoading() {
    loadingState.classList.remove('active');
}

function showJokeCard() {
    jokeCard.classList.add('active');
}

function hideJokeCard() {
    jokeCard.classList.remove('active');
}

function showError() {
    errorState.classList.add('active');
    hideLoading();
}

function hideError() {
    errorState.classList.remove('active');
}

// Toast notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Local Storage
function saveStateToStorage() {
    const storageData = {
        jokeCount: state.jokeCount,
        categoriesSeen: Array.from(state.categoriesSeen)
    };
    localStorage.setItem('jokeAppState', JSON.stringify(storageData));
}

function loadStateFromStorage() {
    const saved = localStorage.getItem('jokeAppState');
    if (saved) {
        const data = JSON.parse(saved);
        state.jokeCount = data.jokeCount || 0;
        state.categoriesSeen = new Set(data.categoriesSeen || []);
        
        jokeCountEl.textContent = state.jokeCount;
        categoryCountEl.textContent = state.categoriesSeen.size;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}