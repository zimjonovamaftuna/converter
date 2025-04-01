const amountEl = document.getElementById("amount");
const fromCurrencyEl = document.getElementById("fromCurrency");
const toCurrencyEl = document.getElementById("toCurrency");
const convertButton = document.getElementById("convertButton");
const swapButton = document.getElementById("swapButton");
const resultEl = document.getElementById("result");
const spinnerEl = document.getElementById("spinner");
const updateDateEl = document.getElementById("updateDate");
const historyListEl = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");

// Замените YOUR_API_KEY на ваш реальный API-ключ
const API_KEY = "ba4a3c3f2f420c85f522875b";
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}`;

// Список валют
const currencies = ["USD", "EUR", "RUB", "GBP", "JPY", "AUD", "CAD", "UZS"];

let autoUpdateInterval;

// Заполнение селекторов валютами
function populateCurrencySelectors() {
  currencies.forEach(currency => {
    const option1 = document.createElement("option");
    option1.value = currency;
    option1.textContent = currency;
    fromCurrencyEl.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = currency;
    option2.textContent = currency;
    toCurrencyEl.appendChild(option2);
  });
  // Значения по умолчанию
  fromCurrencyEl.value = "USD";
  toCurrencyEl.value = "RUB";
}

// Сохранение записи истории в LocalStorage
function saveHistory(record) {
  let history = JSON.parse(localStorage.getItem("conversionHistory")) || [];
  history.unshift(record); // добавляем в начало массива
  // Ограничим историю 20 записями
  history = history.slice(0, 20);
  localStorage.setItem("conversionHistory", JSON.stringify(history));
  renderHistory();
}

// Отображение истории на странице
function renderHistory() {
  const history = JSON.parse(localStorage.getItem("conversionHistory")) || [];
  historyListEl.innerHTML = "";
  history.forEach(record => {
    const li = document.createElement("li");
    li.textContent = record;
    historyListEl.appendChild(li);
  });
}

// Очистка истории
function clearHistory() {
  localStorage.removeItem("conversionHistory");
  renderHistory();
}

async function convertCurrency() {
  const amount = parseFloat(amountEl.value);
  const fromCurrency = fromCurrencyEl.value;
  const toCurrency = toCurrencyEl.value;

  if (isNaN(amount) || amount <= 0) {
    resultEl.textContent = "Введите корректную сумму";
    resultEl.classList.add("shake");
    setTimeout(() => resultEl.classList.remove("shake"), 500);
    return;
  }

  // Показать спиннер загрузки
  spinnerEl.classList.remove("hidden");
  resultEl.textContent = "";
  updateDateEl.textContent = "";

  try {
    const response = await fetch(`${BASE_URL}/latest/${fromCurrency}`);
    const data = await response.json();

    if (data.result === "error") {
      resultEl.textContent = "Ошибка получения курса: " + data["error-type"];
      spinnerEl.classList.add("hidden");
      return;
    }

    const rate = data.conversion_rates[toCurrency];
    if (!rate) {
      resultEl.textContent = "Нет данных по выбранной валюте.";
      spinnerEl.classList.add("hidden");
      return;
    }

    const convertedAmount = (amount * rate).toFixed(2);
    const resultText = `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
    resultEl.textContent = resultText;
    
    // Добавляем класс анимации для плавного появления
    resultEl.classList.remove("animated");
    void resultEl.offsetWidth; // перезапуск анимации
    resultEl.classList.add("animated");

    // Отобразить дату обновления, если доступна
    if (data.time_last_update_utc) {
      updateDateEl.textContent = `Курс обновлен: ${data.time_last_update_utc}`;
      updateDateEl.classList.remove("animated");
      void updateDateEl.offsetWidth;
      updateDateEl.classList.add("animated");
    }
    
    // Сохранение в историю
    const now = new Date().toLocaleString();
    saveHistory(`${now}: ${resultText}`);
  } catch (error) {
    resultEl.textContent = "Ошибка: " + error.message;
  } finally {
    spinnerEl.classList.add("hidden");
  }
}

// Инвертирование валют
function swapCurrencies() {
  const temp = fromCurrencyEl.value;
  fromCurrencyEl.value = toCurrencyEl.value;
  toCurrencyEl.value = temp;
  // Пересчитываем сразу после обмена валют
  convertCurrency();
}

// Функция автообновления курса каждые 60 секунд
function startAutoUpdate() {
  // Если интервал уже установлен, очищаем его
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
  }
  autoUpdateInterval = setInterval(convertCurrency, 60000);
}

// Автоматический пересчет при изменении ввода и выборе валют
function addAutoUpdateListeners() {
  amountEl.addEventListener("input", () => {
    clearTimeout(amountEl.updateTimeout);
    amountEl.updateTimeout = setTimeout(convertCurrency, 500);
  });
  fromCurrencyEl.addEventListener("change", convertCurrency);
  toCurrencyEl.addEventListener("change", convertCurrency);
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
  populateCurrencySelectors();
  renderHistory();
  convertButton.addEventListener("click", convertCurrency);
  swapButton.addEventListener("click", swapCurrencies);
  clearHistoryButton.addEventListener("click", clearHistory);
  addAutoUpdateListeners();
  convertCurrency();
  startAutoUpdate();
});
