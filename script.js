window.addEventListener('scroll', () => {
    const retangulos = document.querySelectorAll('.retangulo');
    const scrollY = window.scrollY;
    
    retangulos.forEach((ret, index) => {
        const rotacaoBase = [-8, 5, -6, 7];
        const novaRotacao = rotacaoBase[index] + (scrollY * 0.02);
        ret.style.transform = `rotate(${novaRotacao}deg)`;
    });
});