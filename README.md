# HabitControl

O HabitControl é um aplicativo de controle de hábitos desenvolvido com React Native e Expo, utilizando Supabase como backend.

## 🚀 Começando

Estas instruções permitirão que você obtenha uma cópia do projeto em operação na sua máquina local para fins de desenvolvimento e teste.

### 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase (gratuita)
- Expo CLI

### 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/habit-control.git
cd habit-control
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Supabase:

   a. Crie uma conta no [Supabase](https://supabase.com)
   
   b. Crie um novo projeto
   
   c. Copie as credenciais do projeto (URL e Anon Key)
   
   d. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

4. Execute as migrações do banco de dados:
   
   a. No painel do Supabase, vá para SQL Editor
   
   b. Cole o conteúdo do arquivo `supabase/migrations/20250603184344_copper_art.sql`
   
   c. Execute o script

5. Inicie o projeto:
```bash
npm run dev
```

## 📱 Funcionalidades

- Autenticação de usuários
- Criação e gerenciamento de hábitos
- Acompanhamento diário
- Histórico de conclusões
- Estatísticas de progresso
- Tema claro/escuro

## 🗄️ Estrutura do Banco de Dados

### Tabelas

#### profiles
- Armazena informações do perfil do usuário
- Campos: id, email, name, created_at, updated_at

#### habits
- Armazena os hábitos do usuário
- Campos: id, user_id, name, time, repeat_type, repeat_value, repeat_days, repeat_dates, created_at, updated_at

#### habit_completions
- Registra as conclusões dos hábitos
- Campos: id, habit_id, user_id, date, completed, completed_at, created_at

### Políticas de Segurança (RLS)

O banco de dados utiliza Row Level Security (RLS) para garantir que:
- Usuários só podem acessar seus próprios dados
- Autenticação é necessária para todas as operações
- Dados são isolados por usuário

## 🛠️ Tecnologias Utilizadas

- [Expo](https://expo.dev/) - Framework React Native
- [Supabase](https://supabase.com/) - Backend e Autenticação
- [React Native](https://reactnative.dev/) - Framework mobile
- [TypeScript](https://www.typescriptlang.org/) - Linguagem de programação

## ✨ Contribuindo

1. Faça o fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para detalhes

## 🎯 Status do Projeto

O projeto está em desenvolvimento ativo. Novas funcionalidades e melhorias são adicionadas regularmente.

## 🤝 Suporte

Para suporte, envie um email para dev@habitcontrol.com ou abra uma issue no repositório.