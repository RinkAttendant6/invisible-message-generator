/**
 * Check if a string is a valid variable name
 * @param {string} str
 * @returns {boolean}
 */
const isVarName = (str) => {
    if (typeof str !== 'string' || str.trim() !== str) {
        return false;
    }

    try {
        new Function(str, 'var ' + str);
        return true;
    } catch {
        return false;
    }
};

/**
 * Handle input
 */
const onInput = () => {
    // Toggle function name field
    document.getElementById('decoderFnName').disabled =
        document.getElementById('decodingOutputFn').value === '';

    const messageEl = document.getElementById('message');
    if (!messageEl.value || /^[\u0001-\u03FF]+$/u.test(messageEl.value)) {
        messageEl.setCustomValidity('');
    } else {
        messageEl.setCustomValidity('Message is invalid');
    }

    const varNameEl = document.getElementById('variableName');
    const varName = varNameEl.value;
    varNameEl.setCustomValidity(
        isVarName(varName) ? '' : 'Invalid identifier name'
    );

    const fnNameEl = document.getElementById('decoderFnName');
    const fnName = fnNameEl.value;
    fnNameEl.setCustomValidity(
        isVarName(fnName) ? '' : 'Invalid identifier name'
    );

    const output = generateOutput();
    const outputBytes = new TextEncoder().encode(output).byteLength;

    document.getElementById('output').textContent = output;
    document.getElementById('outputBytes').textContent = `${outputBytes} bytes`;

    hljs.highlightElement(document.querySelector('pre code'));
};

/**
 * Generate output
 * @returns {string}
 */
const generateOutput = () => {
    const isValid = document.forms[0].checkValidity();

    const varName = document.getElementById('variableName').value;
    const decodingOutputFn = document.getElementById('decodingOutputFn').value;
    const decodingFnName = document.getElementById('decoderFnName').value;
    const message = document.getElementById('message').value;

    const encodedText = isValid
        ? unescape(
              [...message]
                  .map(
                      (char) =>
                          `%uDB40%u${(0xdc00 + char.charCodeAt()).toString(16)}`
                  )
                  .join('')
          )
        : '';

    const outputExpression = `const ${varName} = '${encodedText}';`;
    const comment =
        message && isValid
            ? ''
            : `/* Message is empty or at least one field is invalid */
`;
    const decodingOutput = isValid
        ? `

/**
 * Function to decode invisible messages
 * @param {string} message - Message to decode
 * @returns {string} - Decoded message
 */
const ${decodingFnName} = (message) => escape(message)
    .replace(/%uDB40%u/g, [])
    .match(/..../g)
    .map(c => String.fromCharCode(parseInt(c, 16) - 0xDC00))
    .join([]);

${decodingOutputFn}(${decodingFnName}(${varName}));
`
        : '';

    return (
        comment + outputExpression + (decodingOutputFn ? decodingOutput : '')
    );
};

/**
 * Copy output to clipboard
 */
const onCopyOutput = async () => {
    if (!navigator.clipboard) {
        return window.alert(
            'Text not copied - your browser does not support the Async Clipboard API'
        );
    }

    await navigator.clipboard.writeText(
        document.getElementById('output').textContent
    );
};

/**
 * Download output as file
 */
const onDownloadOutput = () =>
    saveAs(
        new Blob([document.getElementById('output').textContent], {
            type: 'text/javascript',
        }),
        'invisible_message.js'
    );

document.forms[0].addEventListener('input', onInput);
document.addEventListener('DOMContentLoaded', onInput);
document
    .getElementById('copyToClipboard')
    .addEventListener('click', onCopyOutput);
document
    .getElementById('downloadToFile')
    .addEventListener('click', onDownloadOutput);
