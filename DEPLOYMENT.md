# Guia de Publicação - Imperial Barbearia

Este guia contém instruções para publicar o site da Imperial Barbearia em um ambiente de produção (como Vercel, Netlify ou servidor próprio).

## 1. Preparação para Produção

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (ou configure no painel da sua hospedagem) com as seguintes chaves para proteger o acesso administrativo:

```env
VITE_ADMIN_USER=seu_usuario_admin
VITE_ADMIN_PASS=sua_senha_admin
VITE_LEOMAR_USER=leomar
VITE_LEOMAR_PASS=senha_do_leomar
VITE_PEDRO_USER=pedro
VITE_PEDRO_PASS=senha_do_pedro
```

### Build do Projeto
Execute o comando abaixo para gerar os arquivos otimizados para produção:
```bash
npm run build
```
Os arquivos serão gerados na pasta `dist/`.

## 2. Segurança

### Autenticação Client-Side
Este projeto é uma Single Page Application (SPA). A autenticação é feita no navegador. 
*   **Atenção:** Embora as senhas estejam em variáveis de ambiente, elas são incluídas no pacote JavaScript final. Para segurança máxima em um ambiente profissional, recomenda-se a implementação de um **Backend (Node.js/Express)** com banco de dados real.
*   **localStorage:** Os dados de agendamentos e serviços são salvos no navegador do usuário. Para persistência global entre diferentes dispositivos, você precisará conectar o site a um banco de dados (como Firebase, Supabase ou MongoDB).

## 3. Performance Mobile

O código foi otimizado com:
*   **Lazy Loading:** As páginas são carregadas apenas quando acessadas, reduzindo o tempo de carregamento inicial.
*   **Memoização:** Cálculos pesados (como busca de horários disponíveis) foram otimizados para não travar celulares mais simples.
*   **Otimização de Imagens:** Recomenda-se substituir as URLs do Unsplash por imagens locais comprimidas antes da publicação final.

## 4. Como Publicar

### Opção A: Vercel (Recomendado)
1. Conecte seu repositório GitHub à Vercel.
2. Adicione as variáveis de ambiente no painel da Vercel.
3. O deploy será automático.

### Opção B: Servidor Próprio
1. Faça o build (`npm run build`).
2. Envie o conteúdo da pasta `dist/` para o seu servidor web (Apache/Nginx).
3. Certifique-se de configurar o roteamento para SPA (redirecionar todas as rotas para `index.html`).

---
Desenvolvido com foco em elegância e performance.
