let model;

async function loadModel() {
    model = await cocoSsd.load();
    console.log("Model loaded.");
}

loadModel();

function getColorFromRegion(imageData) {
    const data = imageData.data;
    const length = data.length;
    let r = 0, g = 0, b = 0;

    for (let i = 0; i < length; i += 4) {
        r += data[i];     // Red
        g += data[i + 1]; // Green
        b += data[i + 2]; // Blue
    }

    r = Math.floor(r / (length / 4));
    g = Math.floor(g / (length / 4));
    b = Math.floor(b / (length / 4));

    return { r, g, b };
}

const objectCategories = [
    "dog", "cat", "bird", "horse", "cow", "sheep", "elephant", "zebra", "giraffe", "bear", "rabbit", "squirrel",
    "car", "bicycle", "motorcycle", "bus", "train", "airplane", "boat",
    "chair", "table", "laptop", "cell phone", "remote", "backpack", "handbag", "bottle", "cup"
];

const botName = "Aether";

function handleChatbotResponse(userMessage) {
    const lowerCaseMessage = userMessage.toLowerCase();
    let response = "That's interesting!";

    if (lowerCaseMessage.includes("bicycle")) {
        response = `${botName} thinks bicycles are a great choice! What features are you looking for?`;
    } else if (lowerCaseMessage.includes("color")) {
        response = `${botName} says the color of the object is unique! What colors do you prefer?`;
    } else if (lowerCaseMessage.includes("price")) {
        response = `${botName} notes that prices can vary widely. Are you looking for budget-friendly options or something premium?`;
    } else if (lowerCaseMessage.includes("how are you")) {
        response = `${botName} is just a chatbot, but I'm here to assist you!`;
    } else {
        response = `${botName} isn't sure how to respond to that. Can you ask something else?`;
    }

    return response;
}

document.getElementById('send-btn').addEventListener('click', function() {
    const input = document.getElementById('image-input');
    const textInput = document.getElementById('text-input');
    const chatBox = document.getElementById('chat-box');
    const loadingIndicator = document.getElementById('loading');
    const canvasOutput = document.getElementById('canvasOutput');
    const ctx = canvasOutput.getContext('2d');

    if (input.files.length === 0 && textInput.value.trim() === "") {
        alert("Please upload an image or enter a message!");
        return;
    }

    if (textInput.value.trim() !== "") {
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user-message';
        userMessage.textContent = "You: " + textInput.value;
        chatBox.appendChild(userMessage);

        const botResponse = handleChatbotResponse(textInput.value);
        const botMessage = document.createElement('div');
        botMessage.className = 'chat-message bot-message';
        botMessage.textContent = `${botName}: ${botResponse}`;
        chatBox.appendChild(botMessage);
        chatBox.scrollTop = chatBox.scrollHeight;

        textInput.value = "";
    }

    if (input.files.length > 0) {
        const file = input.files[0];
        const reader = new FileReader();

        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user-message';
        userMessage.textContent = "You uploaded: " + file.name;
        chatBox.appendChild(userMessage);

        loadingIndicator.style.display = 'block';
        chatBox.scrollTop = chatBox.scrollHeight;

        reader.onload = function(e) {
            const imgElement = document.createElement('img');
            imgElement.src = e.target.result;

            imgElement.onload = async function() {
                canvasOutput.width = imgElement.width;
                canvasOutput.height = imgElement.height;
                ctx.drawImage(imgElement, 0, 0);

                const predictions = await model.detect(canvasOutput);
                loadingIndicator.style.display = 'none';

                predictions.forEach(prediction => {
                    ctx.beginPath();
                    ctx.rect(prediction.bbox[0], prediction.bbox[1], prediction.bbox[2], prediction.bbox[3]);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = 'red';
                    ctx.fillStyle = 'red';
                    ctx.stroke();
                    ctx.fillText(`${prediction.class} (${Math.round(prediction.score * 100)}%)`, prediction.bbox[0], prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10);
                });

                canvasOutput.style.display = 'block';

                const detectedObjects = predictions.map(d => d.class).filter(obj => objectCategories.includes(obj));
                const botMessage = document.createElement('div');
                botMessage.className = 'chat-message bot-message';
                botMessage.textContent = detectedObjects.length > 0 ? `${botName}: Detected objects: ${detectedObjects.join(', ')}` : `${botName}: No recognizable objects found.`;
                chatBox.appendChild(botMessage);
                chatBox.scrollTop = chatBox.scrollHeight;
            };
        };

        reader.readAsDataURL(file);
        input.value = '';
    }
});
