class SeededRandom {
    constructor(seed) {
        this.seed = this.hashCode(String(seed));
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Math.abs(hash) || 1;
    }

    // Возвращает число от 0 до 1
    next() {
        this.seed ^= this.seed << 13;
        this.seed ^= this.seed >> 17;
        this.seed ^= this.seed << 5;
        return (Math.abs(this.seed) % 10000) / 10000;
    }

    // Возвращает целое число от min до max (включительно)
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    // Возвращает число от min до max
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }
}