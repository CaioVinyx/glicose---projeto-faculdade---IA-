# GLICOSE

Jogo de plataforma 2D feito inteiramente com ferramentas de inteligência artificial para um trabalho de faculdade. O desenvolvimento foi conduzido usando Claude Code como principal agente de refinamento, balanceamento, correção de bugs e melhorias gerais dentro do AntiGravity — sem uma linha de código escrita manualmente.

## Sobre o projeto

Trabalho acadêmico desenvolvido com uso exclusivo de ferramentas de IA generativa, desde a concepção até a implementação final. Sem engine, sem bibliotecas externas: tudo feito em JavaScript puro com Canvas 2D e Web Audio API, rodando direto no navegador.

## História

Uma criança é mandada pela mãe ao mercado comprar açúcar. Ao pegar um pacote suspeito e mais barato no fundo da loja, um portal se abre e ela é sugada para dentro — parar na dimensão do açúcar amaldiçoado. Para voltar para casa, precisa atravessar seis fases, cada uma numa dimensão diferente, e derrotar os guardiões que bloqueiam o caminho. A lógica é propositalmente no-sense.

## Como jogar

Abra `index.html` no navegador. Não é necessário servidor local.

### Controles

| Tecla | Ação |
|---|---|
| `A` / `D` ou setas | Mover |
| `W` / Seta cima / `Espaço` | Pular (no side-scroller) / Mover cima (no prólogo) |
| `S` / Seta baixo | Descer plataforma / Mover baixo (no prólogo) |
| `J` | Ataque de espada |
| `K` | Disparar projétil de açúcar |
| `L` | Ativar escudo temporário |
| `Enter` | Avançar diálogo / Iniciar jogo |

## Estrutura do jogo

### Prólogo — visão top-down
Quatro cenas em perspectiva de cima, estilo Zelda clássico:

1. **Casa do Protagonista** — saia pela porta iluminada
2. **Rua do Mercado** — traverse sem ser atropelado pelos carros
3. **Mercado Liminal** — fale com o funcionário e pegue o açúcar amaldiçoado
4. **Floresta do Velho** — receba as instruções e entre no portal

### Fases — side-scroller
Seis fases de plataforma com inimigos, plataformas e boss ao final de cada uma:

| Fase | Nome | Boss |
|---|---|---|
| 1 | Consultório da Nutricionista | Doutora Fitnessa |
| 2 | Reino de Caramelo | Lorde Pirulatrix |
| 3 | Navio do Capitão Barba-Melaço | Almirante Barba-Melaço |
| 4 | Formigueiro Infinito | Imperador Mandibulon |
| 5 | Cidade da Masmorra | Mestre Pacoquinho |
| Final | O Açúcar Amaldiçoado | O Rei Glicose |

## Mecânicas

- **3 tipos de inimigos**: atirador (dispara projétil mirando), saltador (bate em arco) e investidor (carrega em direção ao jogador)
- **Bosses com 2 fases**: cada boss muda de comportamento e fica mais agressivo ao chegar em 50% de HP
- **Sistema de açúcar**: inimigos derrotados soltam açúcar, que recarrega o disparo de projétil. No Formigueiro, as formigas drenam o açúcar do jogador
- **Escudo**: proteção temporária com cooldown
- **Seleção de melhorias**: nas fases 3 e 6, o jogador escolhe entre +1 de dano ou +2 de HP máximo
- **Beka**: companheira que aparece na fase 5 e permanece até o final
- **Plataformas**: é possível descer por elas segurando S e pulando

## Técnico

- Motor próprio em JavaScript puro, ~2000 linhas
- Renderização em Canvas 2D (960×540), pixel art gerada programaticamente por código
- Áudio sintetizado em tempo real via Web Audio API (sem arquivos de som)
- Sem dependências externas, sem build step — um único `index.html`

## Ferramentas de IA utilizadas

- **Claude Code** (Anthropic) — geração de código, refinamento de mecânicas, balanceamento, correção de bugs e iteração contínua
- Nenhuma linha de código foi escrita manualmente

---

*Projeto acadêmico. O consumo excessivo de açúcar pode causar: trauma, piratas, dimensões paralelas e problemas psicológicos.*
