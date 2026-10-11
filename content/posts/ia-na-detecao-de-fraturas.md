---
slug: ia-na-detecao-de-fraturas
titulo: Como a Inteligência Artificial pode ajudar na detecção de fraturas?
resumo: Um resumo do desenvolvimento do meu TCC, que utilizou IA para identificar fraturas em radiografias de membros superiores.
tags: IA,Python,TCC
data: 2025-01-15
categoria: IA
destaque: true
capa: post-ia-na-detecao-de-fraturas
capaAlt: Radiografia de membro superior analisada pelo modelo de IA
---

No último post falei sobre a conclusão do meu TCC. Agora quero compartilhar como o projeto foi construído — da escolha das ferramentas até o treinamento do modelo.

Desenvolvi um sistema baseado em Inteligência Artificial capaz de analisar radiografias de membros superiores e identificar a presença de fraturas. A seguir, um resumo das principais etapas.

## Escolha da tecnologia

O projeto foi desenvolvido em **Python**, utilizando:

- **OpenCV** para pré-processamento das imagens;
- **Keras** para construção e treinamento da Rede Neural Convolucional (CNN).

Essa combinação trouxe velocidade no desenvolvimento e flexibilidade na criação do modelo.

## O modelo de IA

Implementei uma **Rede Neural Convolucional (CNN)**, uma técnica essencial em visão computacional por sua capacidade de extrair padrões complexos de imagens.  
Ela se mostrou ideal para identificar características que diferenciam uma radiografia saudável de uma com fratura.

## Base de dados

O treinamento foi feito com um dataset do **Kaggle**, contendo imagens com e sem fraturas.  
As etapas incluíram:

- Pré-processamento das radiografias (redimensionamento, normalização, limpeza);
- Divisão em **treino** e **validação** para avaliar o desempenho do modelo.

## Treinamento e avaliação

Durante o treinamento, a CNN aprendeu a reconhecer padrões visuais associados a fraturas.  
Os resultados apresentaram uma boa taxa de acerto, reforçando o potencial da IA como ferramenta de apoio ao diagnóstico médico.

## Resultados e próximos passos

O projeto funcionou como uma prova de conceito promissora.  
Como melhorias futuras, pretendo:

- Ampliar a base de dados;
- Aprimorar a interface do sistema;
- Otimizar o modelo para lidar com mais tipos de fraturas e variações de imagem.

A Inteligência Artificial já é uma realidade crescente na saúde.  
Projetos como este mostram como tecnologia e medicina podem caminhar juntas para oferecer diagnósticos mais rápidos, precisos e acessíveis.
