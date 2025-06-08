// DOM要素の取得
const inputValue = document.getElementById('input-value');
const inputBase = document.getElementById('input-base');
const outputBase = document.getElementById('output-base');
const customInputBase = document.getElementById('custom-input-base');
const customOutputBase = document.getElementById('custom-output-base');
const convertBtn = document.getElementById('convert-btn');
const clearBtn = document.getElementById('clear-btn');
const resultBox = document.getElementById('result');
const explanationBox = document.getElementById('explanation');
const inputError = document.getElementById('input-error');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// 履歴の初期化
let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];

// 初期表示時に履歴を読み込む
window.addEventListener('DOMContentLoaded', () => {
    updateHistoryDisplay();
    toggleCustomBaseInputs();
});

// カスタム進数入力フィールドの表示/非表示を切り替える
inputBase.addEventListener('change', toggleCustomBaseInputs);
outputBase.addEventListener('change', toggleCustomBaseInputs);

// 変換ボタンのクリックイベント
convertBtn.addEventListener('click', performConversion);

// クリアボタンのクリックイベント
clearBtn.addEventListener('click', () => {
    inputValue.value = '';
    resultBox.textContent = '';
    explanationBox.innerHTML = '';
    inputError.textContent = '';
    inputValue.classList.remove('error');
});

// 履歴クリアボタンのクリックイベント
clearHistoryBtn.addEventListener('click', () => {
    conversionHistory = [];
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
    updateHistoryDisplay();
});

// 入力フィールドでEnterキーを押したときに変換を実行
inputValue.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performConversion();
    }
});

// 入力値の検証
inputValue.addEventListener('input', () => {
    validateInput();
});

/**
 * カスタム進数入力フィールドの表示/非表示を切り替える
 */
function toggleCustomBaseInputs() {
    customInputBase.style.display = inputBase.value === 'custom' ? 'block' : 'none';
    customOutputBase.style.display = outputBase.value === 'custom' ? 'block' : 'none';
}

/**
 * 入力値が選択された進数に対して有効かどうかを検証する
 * @returns {boolean} 入力が有効な場合はtrue、そうでない場合はfalse
 */
function validateInput() {
    const value = inputValue.value.trim();
    if (!value) {
        inputError.textContent = '';
        inputValue.classList.remove('error');
        return false;
    }

    const base = getInputBase();
    const validChars = getValidCharsForBase(base);
    const regex = new RegExp(`^[${validChars}]+$`, 'i');

    if (!regex.test(value)) {
        inputError.textContent = `${base}進数には ${validChars.toUpperCase()} のみ使用できます`;
        inputValue.classList.add('error');
        return false;
    }

    inputError.textContent = '';
    inputValue.classList.remove('error');
    return true;
}

/**
 * 指定された進数に対して有効な文字を取得する
 * @param {number} base 進数
 * @returns {string} 有効な文字のリスト
 */
function getValidCharsForBase(base) {
    const digits = '0123456789';
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    
    if (base <= 10) {
        return digits.substring(0, base);
    } else {
        return digits + letters.substring(0, base - 10);
    }
}

/**
 * 入力進数を取得する
 * @returns {number} 入力進数
 */
function getInputBase() {
    return inputBase.value === 'custom' 
        ? parseInt(customInputBase.value, 10) 
        : parseInt(inputBase.value, 10);
}

/**
 * 出力進数を取得する
 * @returns {number} 出力進数
 */
function getOutputBase() {
    return outputBase.value === 'custom' 
        ? parseInt(customOutputBase.value, 10) 
        : parseInt(outputBase.value, 10);
}

/**
 * 進数変換の解説を生成する
 * @param {string} value 入力値
 * @param {number} fromBase 入力進数
 * @param {string} result 出力値
 * @param {number} toBase 出力進数
 * @returns {string} 解説のHTML
 */
function generateExplanation(value, fromBase, result, toBase) {
    let explanation = '';
    
    // 入力値を10進数に変換する過程
    const decimalValue = parseInt(value, fromBase);
    
    if (fromBase !== 10) {
        explanation += '<div class="explanation-step">';
        explanation += `<strong>ステップ1: ${fromBase}進数から10進数への変換</strong><br>`;
        explanation += `${value} (${fromBase}進数) を10進数に変換します。<br>`;
        
        // 各桁の計算を表示
        const digits = value.toLowerCase().split('').reverse();
        let calculation = '';
        let total = 0;
        
        for (let i = 0; i < digits.length; i++) {
            const digit = digits[i];
            const digitValue = digit >= '0' && digit <= '9' ? 
                parseInt(digit) : 
                digit.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
            
            const positionValue = Math.pow(fromBase, i);
            const stepValue = digitValue * positionValue;
            total += stepValue;
            
            if (calculation) calculation += ' + ';
            calculation += `${digit.toUpperCase()}×${fromBase}^${i}`;
            if (i === 0) {
                calculation += ` = ${digitValue}×1 = ${stepValue}`;
            } else {
                calculation += ` = ${digitValue}×${positionValue} = ${stepValue}`;
            }
        }
        
        explanation += `計算: ${calculation}<br>`;
        explanation += `合計: ${total} (10進数)`;
        explanation += '</div>';
    }
    
    // 10進数から目標進数への変換過程
    if (toBase !== 10) {
        explanation += '<div class="explanation-step">';
        explanation += `<strong>ステップ${fromBase !== 10 ? '2' : '1'}: 10進数から${toBase}進数への変換</strong><br>`;
        explanation += `${decimalValue} (10進数) を${toBase}進数に変換します。<br>`;
        
        // 割り算の過程を表示
        let num = decimalValue;
        let steps = [];
        
        if (num === 0) {
            steps.push('0 ÷ ' + toBase + ' = 0 余り 0');
        } else {
            while (num > 0) {
                const quotient = Math.floor(num / toBase);
                const remainder = num % toBase;
                const remainderChar = remainder < 10 ? 
                    remainder.toString() : 
                    String.fromCharCode('A'.charCodeAt(0) + remainder - 10);
                
                steps.push(`${num} ÷ ${toBase} = ${quotient} 余り ${remainder} (${remainderChar})`);
                num = quotient;
            }
        }
        
        explanation += '計算過程:<br>';
        for (const step of steps) {
            explanation += `${step}<br>`;
        }
        
        explanation += `余りを下から読むと: ${result} (${toBase}進数)`;
        explanation += '</div>';
    }
    
    // 同じ進数の場合
    if (fromBase === toBase) {
        explanation += '<div class="explanation-step">';
        explanation += `<strong>同じ進数での変換</strong><br>`;
        explanation += `${fromBase}進数から${toBase}進数への変換なので、値は変わりません。<br>`;
        explanation += `${value} = ${result}`;
        explanation += '</div>';
    }
    
    return explanation;
}
/**
 * 進数変換を実行する
 */
function performConversion() {
    if (!validateInput()) {
        if (!inputValue.value.trim()) {
            inputError.textContent = '値を入力してください';
            inputValue.classList.add('error');
        }
        return;
    }

    const value = inputValue.value.trim();
    const fromBase = getInputBase();
    const toBase = getOutputBase();

    try {
        // 入力値を10進数に変換
        const decimalValue = parseInt(value, fromBase);
        
        // 10進数から目標の進数に変換
        let result;
        if (isNaN(decimalValue)) {
            throw new Error('無効な入力値です');
        } else {
            result = decimalValue.toString(toBase).toUpperCase();
        }

        // 結果を表示
        resultBox.textContent = result;
        
        // 解説を生成・表示
        const explanation = generateExplanation(value, fromBase, result, toBase);
        explanationBox.innerHTML = explanation;
        
        // 履歴に追加
        addToHistory(value, fromBase, result, toBase);
    } catch (error) {
        inputError.textContent = error.message;
        inputValue.classList.add('error');
    }
}

/**
 * 変換履歴に追加する
 * @param {string} input 入力値
 * @param {number} inputBase 入力進数
 * @param {string} output 出力値
 * @param {number} outputBase 出力進数
 */
function addToHistory(input, inputBase, output, outputBase) {
    const historyItem = {
        input,
        inputBase,
        output,
        outputBase,
        timestamp: new Date().toISOString()
    };

    // 履歴の先頭に追加（最新の履歴が一番上に表示されるように）
    conversionHistory.unshift(historyItem);
    
    // 履歴は最大10件まで保存
    if (conversionHistory.length > 10) {
        conversionHistory.pop();
    }
    
    // ローカルストレージに保存
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
    
    // 履歴表示を更新
    updateHistoryDisplay();
}

/**
 * 履歴表示を更新する
 */
function updateHistoryDisplay() {
    historyList.innerHTML = '';
    
    if (conversionHistory.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'history-item';
        emptyMessage.textContent = '履歴はありません';
        historyList.appendChild(emptyMessage);
        return;
    }
    
    conversionHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const conversion = document.createElement('div');
        conversion.textContent = `${item.input} (${item.inputBase}進数) → ${item.output} (${item.outputBase}進数)`;
        
        const details = document.createElement('div');
        details.className = 'history-details';
        
        const date = new Date(item.timestamp);
        details.textContent = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        historyItem.appendChild(conversion);
        historyItem.appendChild(details);
        
        // 履歴項目をクリックしたときに、その変換を再現する
        historyItem.addEventListener('click', () => {
            inputValue.value = item.input;
            
            if (item.inputBase <= 16 && [2, 8, 10, 16].includes(item.inputBase)) {
                inputBase.value = item.inputBase;
                customInputBase.style.display = 'none';
            } else {
                inputBase.value = 'custom';
                customInputBase.value = item.inputBase;
                customInputBase.style.display = 'block';
            }
            
            if (item.outputBase <= 16 && [2, 8, 10, 16].includes(item.outputBase)) {
                outputBase.value = item.outputBase;
                customOutputBase.style.display = 'none';
            } else {
                outputBase.value = 'custom';
                customOutputBase.value = item.outputBase;
                customOutputBase.style.display = 'block';
            }
            
            resultBox.textContent = item.output;
            
            // 解説も再生成して表示
            const explanation = generateExplanation(item.input, item.inputBase, item.output, item.outputBase);
            explanationBox.innerHTML = explanation;
            
            validateInput();
        });
        
        historyList.appendChild(historyItem);
    });
}

// カスタム進数の入力範囲を制限（2〜36）
customInputBase.addEventListener('input', () => {
    let value = parseInt(customInputBase.value, 10);
    if (isNaN(value) || value < 2) {
        customInputBase.value = 2;
    } else if (value > 36) {
        customInputBase.value = 36;
    }
});

customOutputBase.addEventListener('input', () => {
    let value = parseInt(customOutputBase.value, 10);
    if (isNaN(value) || value < 2) {
        customOutputBase.value = 2;
    } else if (value > 36) {
        customOutputBase.value = 36;
    }
});

