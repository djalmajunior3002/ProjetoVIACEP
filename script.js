const CHAVE_OPENWEATHER = 'ba605efc18f1572f61892fe426f18a1a'; 

//DOM
const form = document.getElementById('cadastroForm');
const cepInput = document.getElementById('cep');
const cidadeInput = document.getElementById('cidade');
const estadoInput = document.getElementById('estado');
const logradouroInput = document.getElementById('logradouro');
const bairroInput = document.getElementById('bairro');
const cadastroContainer = document.getElementById('cadastro-container');
const climaContainer = document.getElementById('clima-container');
const climaCidadeSpan = document.getElementById('clima-cidade');
const temperaturaSpan = document.getElementById('temperatura');
const horaLocalSpan = document.getElementById('hora-local');


let relogioIntervalId = null; 

// Viacep
cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cep.length !== 8) return;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            alert('CEP não encontrado.');
            return;
        }

        logradouroInput.value = data.logradouro;
        bairroInput.value = data.bairro;
        cidadeInput.value = data.localidade;
        estadoInput.value = data.uf;

    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        alert('Erro na comunicação com o serviço ViaCEP.');
    }
});



form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const cliente = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        cep: cepInput.value,
        logradouro: logradouroInput.value,
        bairro: bairroInput.value,
        cidade: cidadeInput.value,
        estado: estadoInput.value,
    };

    // Salvar storage
    localStorage.setItem('clienteCadastrado', JSON.stringify(cliente));
    alert('Cliente cadastrado com sucesso!');
    
    
    cadastroContainer.style.display = 'none';
    climaContainer.style.display = 'block';


    await buscarClimaECidade(cliente.cidade, cliente.estado);
});



async function buscarClimaECidade(cidade, estado) {
    
    if (!CHAVE_OPENWEATHER || CHAVE_OPENWEATHER === 'SUA_CHAVE_AQUI') { 
         
        climaCidadeSpan.textContent = `${cidade}/${estado}`;
        temperaturaSpan.textContent = 'Chave de API de Clima não configurada.';
        temperaturaSpan.className = 'temperatura-cor';
        horaLocalSpan.textContent = 'Não é possível obter a hora local sem a API.';
        return;
    }

    try {
        
        const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${cidade},${estado},BR&limit=1&appid=${CHAVE_OPENWEATHER}`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
            alert('Coordenadas da cidade não encontradas.');
            return;
        }

        const lat = geoData[0].lat;
        const lon = geoData[0].lon;
        
        
        const climaUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${CHAVE_OPENWEATHER}`;
        const climaResponse = await fetch(climaUrl);
        const climaData = await climaResponse.json();

        const temperatura = climaData.main.temp;
        const timezoneOffset = climaData.timezone; // Deslocamento em segundos em relação ao UTC

        
        climaCidadeSpan.textContent = `${cidade}/${estado}`;

        
        temperaturaSpan.textContent = `${temperatura.toFixed(1)}°C`;
        aplicarCorTemperatura(temperatura);

        
        exibirHoraLocal(timezoneOffset);

    } catch (error) {
        console.error('Erro ao buscar dados de clima:', error);
        alert('Erro ao buscar dados de clima.');
    }
}



function aplicarCorTemperatura(temp) {
    temperaturaSpan.className = 'temperatura-cor'; // Reset
    if (temp < 15) {
        temperaturaSpan.classList.add('temperatura-azul');
    } else if (temp >= 15 && temp <= 30) {
        temperaturaSpan.classList.add('temperatura-verde');
    } else { // temp > 30
        temperaturaSpan.classList.add('temperatura-vermelho');
    }
}



function exibirHoraLocal(offsetSegundos) {
    
    if (relogioIntervalId !== null) {
        clearInterval(relogioIntervalId);
    }
    
    const atualizarRelogio = () => {
        
        const dataUTC = new Date();
        
        const tempoUTCms = dataUTC.getTime() + (dataUTC.getTimezoneOffset() * 60000); 

        
        const tempoLocalms = tempoUTCms + (offsetSegundos * 1000);

        
        const dataLocal = new Date(tempoLocalms);

        // horário
        const horaFormatada = dataLocal.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        horaLocalSpan.textContent = horaFormatada;
    };

        atualizarRelogio();
//relógio
    relogioIntervalId = setInterval(atualizarRelogio, 1000);
}



function inicializar() {
    const clienteSalvo = localStorage.getItem('clienteCadastrado');
    if (clienteSalvo) {
        const cliente = JSON.parse(clienteSalvo);
        

        cadastroContainer.style.display = 'none';
        climaContainer.style.display = 'block';
        
        buscarClimaECidade(cliente.cidade, cliente.estado);
    }
}

document.addEventListener('DOMContentLoaded', inicializar);
