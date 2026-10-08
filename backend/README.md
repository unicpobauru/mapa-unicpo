# Backend: notas dos alunos + reportes de suporte

Tudo fica numa **Planilha Google da UniCPO**. É grátis e não precisa de cartão.

## Instalação (uma vez só, ~5 minutos)

1. No Google Drive da conta da UniCPO, crie uma planilha nova chamada **"Mapa UniCPO – votos e reportes"**.
2. Na planilha: menu **Extensões → Apps Script**.
3. Apague o código que aparece e cole todo o conteúdo de [`Code.gs`](Code.gs). Clique em 💾 **Salvar**.
4. No seletor de função (ao lado de "Executar"), escolha **`setup`** e clique em **Executar**.
   - O Google vai pedir autorização: escolha a conta da UniCPO → "Avançado" → "Acessar (não seguro)" → **Permitir**.
     (Aparece "não verificado" porque o script é seu, não de uma empresa. As permissões são: editar esta planilha e enviar e-mail para você.)
   - Volte na planilha: devem existir as abas **Votos** e **Reportes**.
5. Clique em **Implantar → Nova implantação** → engrenagem ⚙️ → **App da Web**:
   - Descrição: `mapa`
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
   - Clique em **Implantar** e copie a **URL do app da Web** (termina em `/exec`).
6. Cole essa URL em `config.js`, no campo `apiUrl`, e publique o site (ou mande a URL para o Claude).

## Como usar no dia a dia

- **Votos**: a aba *Votos* tem uma linha por aluno e lugar. Se o aluno votar de novo, a linha dele é atualizada (não duplica).
  Para tirar um voto falso, apague a linha. A média no site se atualiza em até 1 minuto.
- **Reportes**: cada um chega como linha na aba *Reportes* com Estado = `Pendiente`, e você recebe um e-mail.
  Confira, corrija o mapa na aba *Correcciones* se for o caso e mude o Estado para `Resuelto` ou `Descartado`.
  Os reportes **nunca aparecem no site**, com uma exceção: se **3 aparelhos diferentes** reportarem "El lugar cerró"
  e os reportes continuarem `Pendiente`, o mapa mostra "⚠️ Posiblemente cerrado" e apaga o pin.
  Marcar como `Descartado` tira o aviso na hora; confirmar o fechamento na aba *Correcciones* tira o lugar do mapa.
- **Correcciones** (o mapa se atualiza sozinho **toda segunda às 8h**):
  - **Mudar um lugar:** escolha o lugar na coluna *Lugar ID* (lista suspensa) e preencha **só** o que mudou
    (Dirección, Horario, Teléfono, Instagram, Descripción…). O que ficar vazio continua igual.
  - **Lugar fechou:** escolha o lugar e em *Estado* coloque `Cerrado`. Ele sai do mapa.
  - **Lugar novo:** deixe *Lugar ID* **vazio** e preencha Nombre, Categoría, Latitud e Longitud
    (no Google Maps: clique com o botão direito no lugar → os números aparecem no topo do menu; clique para copiar).
  - A coluna *Nota interna* nunca é publicada.
  - Não quer esperar a segunda? No GitHub: **Actions → "Actualización semanal del mapa" → Run workflow**.
- **Config**: na linha "E-mails que reciben los reportes", coloque os e-mails do CS separados por vírgula (ex.: `cs@unicpo.com.br, marketingunicpo@gmail.com`). Vale na hora, sem mexer em código.
- **Lugares**: lista de todos os lugares do mapa com o ID e o link. Atualiza sozinha toda segunda às 6h
  (ou no menu da planilha **Mapa UniCPO → Actualizar lista de lugares**).

## Proteções que já vêm no código

- 1 voto por aparelho e lugar; o botão só libera com estrelas + "¿Te entendieron?" + "Soy alumno(a) de UniCPO".
- Reporte em 2 passos: escolher o problema → tela de confirmação com "Lo verifiqué personalmente" obrigatório.
- Mesmo reporte repetido pelo mesmo aparelho é ignorado; máximo de 5 reportes por aparelho por dia; 40 votos por hora.
- Campo invisível anti-robô e validação de todos os dados.

## Se mudar o `Code.gs` depois

1. Cole o código novo no editor e salve.
2. Rode **`setup`** de novo (pode pedir autorização para permissões novas: é normal).
3. **Implantar → Gerenciar implantações → ✏️ editar → Versão: Nova versão → Implantar.** A URL continua a mesma.
