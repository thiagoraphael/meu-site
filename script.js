const retangulos = document.querySelectorAll('.retangulo');
const rotacaoBase = [-8, 5, -6, 7];
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            retangulos.forEach((ret, index) => {
                const novaRotacao = rotacaoBase[index] + (scrollY * 0.02);
                ret.style.transform = `rotate(${novaRotacao}deg)`;
            });
            ticking = false;
        });
        ticking = true;
    }
});