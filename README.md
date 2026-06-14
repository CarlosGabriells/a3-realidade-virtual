# Pré-auditoria de acessibilidade em VR

Protótipo acadêmico de computação gráfica e realidade virtual para comparar
alternativas de anteprojeto antes da execução física. A aplicação reconstrói
três ambientes em escala 1:1, calcula critérios selecionados de acessibilidade,
simula a circulação de uma pessoa em cadeira de rodas e aplica correções
paramétricas.

## Problema de engenharia

Barreiras de acessibilidade percebidas apenas durante ou depois da obra geram
retrabalho, custo e perda de qualidade. O protótipo apoia a revisão preliminar
ao tornar as dimensões visíveis e navegáveis nos cenários de entrada/rampa,
corredor e banheiro.

## Recursos

- modelagem procedural em metros com A-Frame e Three.js;
- navegação em primeira pessoa e suporte a WebXR;
- colisões e bloqueio de rotas não conformes para o perfil cadeirante;
- 14 verificações paramétricas com comparação antes/depois;
- correção mínima por ambiente ou do projeto completo;
- HUD minimizável, redimensionável e persistente;
- exportação de diagnóstico textual;
- testes automatizados das regras e da navegação.

## Executar

```bash
python3 -m http.server 4173
```

Abra `http://127.0.0.1:4173`.

## Testar

```bash
node --test tests/*.test.js
```

## Organização

- `js/environments/`: construtores dos ambientes;
- `js/scene-builder.js`: primitivas e utilitários geométricos;
- `js/rooms.js`: catálogo, regras, correções e colisores;
- `js/navigation.js`: movimentação e testes de ocupação;
- `js/hud.js`: estado, interface e relatório;
- `report/`: relatório acadêmico e gerador do documento.

## Limites

É uma pré-verificação educacional de critérios selecionados. Não substitui
levantamento, projeto executivo, análise integral da ABNT NBR 9050 ou laudo
profissional.
