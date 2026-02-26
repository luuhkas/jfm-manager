# 🚀 JFM Manager

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange)
![Electron](https://img.shields.io/badge/Electron-40.x-9feaf9)

Sistema desktop desenvolvido com Electron, Node.js e React para gestão interna da JF Mecatrônica.

---

## 📌 Sobre o Projeto
O **JFM Manager** é uma aplicação desktop criada para centralizar e organizar processos internos da empresa JF Mecatrônica.

A primeira versão contempla:

- ⏱ Controle de jornada de trabalho  
- 📝 Registro de ponto  
- 🧮 Base para cálculo de horas trabalhadas  
- 🔄 Estrutura preparada para futuras funcionalidades  

O projeto foi desenvolvido com foco em organização, versionamento profissional e escalabilidade.

---

## 🛠 Tecnologias Utilizadas
- ⚡ Electron
- 🟢 Node.js
- ⚡ Vite
- ⚛️ React
- 💻 JavaScript
- 🌿 Git / 🐙 GitHub

---

## ▶️ Como Executar o Projeto
### 1️⃣ Clonar o repositório
```bash
git clone https://github.com/luuhkas/jfm-manager.git
cd jfm-manager
```

### 2️⃣ Instalar dependências
```bash
npm install
```

### 3️⃣ Executar (desenvolvimento)
```bash
npm run dev
```

### 4️⃣ Executar (modo padrão)
```bash
npm start
```

---

## 📂 Estrutura do Projeto
```
jfm-manager/
│
├── src/
│   └── main/              # Processo principal (Electron)
│       └── main.js
│
├── renderer/              # Interface (Vite + React)
│   ├── package.json
│   └── ...
│
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

## 📈 Roadmap

- [ ]  🎨 Melhorar UI/UX (layout, componentes, telas)
- [ ] 👥 Módulo de funcionários
- [ ] 💾 Persistência de dados
- [ ] ⏳ Cálculo de horas extras
- [ ] 🌙 Adicional noturno (CLT)
- [ ] 📊 Geração de relatórios
- [ ] 🧾 Emissão de ordens de serviço

---

## 📦 Status do Projeto

🟢 Estrutura inicial concluída  
🟡 Interface básica funcional  
🔜 Em desenvolvimento contínuo

---

## 👨‍💻 Autor

Lucas Maués  
Desenvolvedor Full Stack em formação

---

## 📄 Licença

Projeto sob licença MIT.