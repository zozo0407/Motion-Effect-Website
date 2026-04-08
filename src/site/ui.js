export const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_//";

export function flipCard(card) {
    const inner = card.querySelector('.preserve-3d');
    inner.classList.toggle('rotate-y-180');
}

export function initTextScramble() {
    document.querySelectorAll('.scramble-hover').forEach(element => {
        element.addEventListener('mouseenter', event => {
            let iteration = 0;
            const originalText = event.target.dataset.value || event.target.innerText;
            
            clearInterval(event.target.interval);
            
            event.target.interval = setInterval(() => {
                event.target.innerText = originalText
                    .split("")
                    .map((letter, index) => {
                        if(index < iteration) {
                            return originalText[index];
                        }
                        return letters[Math.floor(Math.random() * 26)];
                    })
                    .join("");
                
                if(iteration >= originalText.length) {
                    clearInterval(event.target.interval);
                }
                
                iteration += 1 / 3;
            }, 30);
        });
    });
}

