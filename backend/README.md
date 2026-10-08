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
  Confira, corrija o mapa se for o caso (peça ao Claude ou edite `data/curated.mjs` / `data/google-places.tsv`) e mude o Estado para `Resuelto` ou `Descartado`.
  Os reportes **nunca aparecem no site**: nenhum estabelecimento é "acusado" publicamente.

## Proteções que já vêm no código

- 1 voto por aparelho e lugar; o botão só libera com estrelas + "¿Te entendieron?" + "Soy alumno(a) de UniCPO".
- Reporte em 2 passos: escolher o problema → tela de confirmação com "Lo verifiqué personalmente" obrigatório.
- Mesmo reporte repetido pelo mesmo aparelho é ignorado; máximo de 5 reportes por aparelho por dia; 40 votos por hora.
- Campo invisível anti-robô e validação de todos os dados.

## Se mudar o `Code.gs` depois

**Implantar → Gerenciar implantações → ✏️ editar → Versão: Nova versão → Implantar.** A URL continua a mesma.
