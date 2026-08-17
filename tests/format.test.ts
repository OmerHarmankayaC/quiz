import { describe, it, expect } from 'vitest';
import { sayiCozumle, sayiMetni } from '@/lib/game/format';
import { SLIDER_MAX, sliderDegerine, tahminiYuvarla } from '@/lib/game/scoring';

describe('sayiMetni', () => {
	it('milyon esigini turkce yazar', () => {
		expect(sayiMetni(2_500_000)).toBe('2,5 milyon');
		expect(sayiMetni(75_000_000)).toBe('75 milyon');
	});

	it('bin ve milyar esiklerini yazar', () => {
		expect(sayiMetni(1_000)).toBe('1 bin');
		expect(sayiMetni(3_200_000_000)).toBe('3,2 milyar');
	});

	it('trilyon ve katrilyon esiklerini yazar', () => {
		expect(sayiMetni(1e12)).toBe('1 trilyon');
		expect(sayiMetni(5.5e14)).toBe('550 trilyon');
		expect(sayiMetni(1e15)).toBe('1 katrilyon');
		expect(sayiMetni(2e16)).toBe('20 katrilyon');
		expect(sayiMetni(1.67e16)).toBe('17 katrilyon');
	});

	it('buyuk tam sayiyi binlik ayracla gruplar', () => {
		expect(sayiMetni(1e18)).toBe('1.000 katrilyon');
		expect(sayiMetni(1.2e19)).toBe('12.000 katrilyon');
	});

	it('slider menzilinin tepesini rakam yigini olarak vermez', () => {
		expect(sayiMetni(1e17)).toBe('100 katrilyon');
	});

	it('kucuk sayilari oldugu gibi verir', () => {
		expect(sayiMetni(130)).toBe('130');
		expect(sayiMetni(8.5)).toBe('8,5');
	});

	it('sonlu olmayan sayi icin tire verir', () => {
		expect(sayiMetni(Infinity)).toBe('—');
	});
});

describe('sayiCozumle', () => {
	it('virgulu ondalik ayraci sayar', () => {
		expect(sayiCozumle('0,1')).toBe(0.1);
		expect(sayiCozumle('12,6')).toBe(12.6);
	});

	it('uc basamakli tek noktayi binlik ayraci sayar', () => {
		expect(sayiCozumle('1.460')).toBe(1460);
	});

	it('ayracsiz sayiyi oldugu gibi cozer', () => {
		expect(sayiCozumle('1460')).toBe(1460);
	});

	it('ucten farkli kesirli tek noktayi ondalik sayar', () => {
		expect(sayiCozumle('0.1')).toBe(0.1);
		expect(sayiCozumle('1.5')).toBe(1.5);
		expect(sayiCozumle('1.4600')).toBe(1.46);
	});

	it('tam uc basamakli kesir binlik grubu sayilir', () => {
		// "1.460" ile "0.126" ayirt edilemez; kural noktayi binlik ayraci kabul eder.
		// Kutu Turkce gosterimle doldugu icin oyuncunun kendi degeri bu dala dusmez.
		expect(sayiCozumle('0.126')).toBe(126);
	});

	it('birden fazla noktayi binlik gruplamasi sayar', () => {
		expect(sayiCozumle('1.234.567')).toBe(1234567);
	});

	it('virgul varken noktalar binlik ayracidir', () => {
		expect(sayiCozumle('1.234,5')).toBe(1234.5);
	});

	it('bosluklari yok sayar', () => {
		expect(sayiCozumle('  12,6  ')).toBe(12.6);
		expect(sayiCozumle('1 234')).toBe(1234);
	});

	it('sayi olmayan metin icin null verir', () => {
		expect(sayiCozumle('abc')).toBe(null);
		expect(sayiCozumle('1,2,3')).toBe(null);
	});

	it('bos metin icin null verir', () => {
		expect(sayiCozumle('')).toBe(null);
		expect(sayiCozumle('   ')).toBe(null);
	});

	it('sifir ve negatif icin null verir', () => {
		expect(sayiCozumle('0')).toBe(null);
		expect(sayiCozumle('-5')).toBe(null);
	});
});

describe('tahmin kutusu gidis-donusu', () => {
	// Kutu String(deger).replace('.', ',') ile doldurulur. Her slider kademesi icin
	// bu metnin cozumu ayni degeri vermeli - yoksa kutuyu acip kapatmak tahmini
	// 10x-1000x kaydirir (0,126 -> 126 gibi).
	it('her slider kademesi ayni degere geri doner', () => {
		for (let kademe = 0; kademe <= SLIDER_MAX; kademe++) {
			const deger = tahminiYuvarla(sliderDegerine(kademe));
			const kutuMetni = String(deger).replace('.', ',');
			const cozulen = sayiCozumle(kutuMetni);
			expect(cozulen, `kademe ${kademe} metni ${kutuMetni}`).not.toBe(null);
			expect(tahminiYuvarla(cozulen as number), `kademe ${kademe}`).toBe(deger);
		}
	});
});
