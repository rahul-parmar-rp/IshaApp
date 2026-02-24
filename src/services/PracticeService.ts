import { YogaPractice } from '../types';

export class PracticeService {
  static readonly DEFAULT_PRACTICES: YogaPractice[] = [
    { id: '1', name: 'Isha Kriya', duration: 15, order: 1 },
    { id: '5', name: 'Bhuta Shuddhi', duration: 35, order: 2 },
    { id: '2', name: 'Surya Kriya', duration: 50, order: 3 },
    { id: '3', name: 'Angamardana', duration: 50, order: 4 },
    { id: '4', name: 'Yogasanas', duration: 75, order: 5 },
  ];

  static updatePractice(
    practices: YogaPractice[],
    id: string,
    field: 'name' | 'duration' | 'order',
    value: string | number
  ): YogaPractice[] {
    return practices.map((practice: YogaPractice) =>
      practice.id === id
        ? {
            ...practice,
            [field]: field === 'duration' || field === 'order'
              ? parseInt(value.toString(), 10) || 0
              : value,
          }
        : practice
    );
  }

  static movePracticeOrder(
    practices: YogaPractice[],
    id: string,
    direction: 'up' | 'down'
  ): YogaPractice[] {
    const currentPractice = practices.find(p => p.id === id);
    if (!currentPractice) {
      return practices;
    }

    const sortedPractices = [...practices].sort((a, b) => a.order - b.order);
    const currentIndex = sortedPractices.findIndex(p => p.id === id);

    if (direction === 'up' && currentIndex > 0) {
      const targetPractice = sortedPractices[currentIndex - 1];
      return this.swapPracticeOrders(practices, currentPractice, targetPractice);
    } else if (direction === 'down' && currentIndex < sortedPractices.length - 1) {
      const targetPractice = sortedPractices[currentIndex + 1];
      return this.swapPracticeOrders(practices, currentPractice, targetPractice);
    }

    return practices;
  }

  private static swapPracticeOrders(
    practices: YogaPractice[],
    practice1: YogaPractice,
    practice2: YogaPractice
  ): YogaPractice[] {
    return practices.map(p => {
      if (p.id === practice1.id) {
        return { ...p, order: practice2.order };
      } else if (p.id === practice2.id) {
        return { ...p, order: practice1.order };
      }
      return p;
    });
  }

  static getCustomPractices(practices: YogaPractice[]): YogaPractice[] {
    return practices.filter(p =>
      p.id.startsWith('custom_') ||
      p.id.startsWith('imported_') ||
      p.id.startsWith('manual_')
    );
  }

  static getAllPracticesSorted(practices: YogaPractice[]): YogaPractice[] {
    return [...practices].sort((a, b) => a.order - b.order);
  }

  static getLearnedPractices(
    practices: YogaPractice[],
    learnedIds: string[]
  ): YogaPractice[] {
    return practices
      .filter(p => learnedIds.includes(p.id))
      .sort((a, b) => a.order - b.order);
  }

  static addPractices(
    existingPractices: YogaPractice[],
    newPractices: YogaPractice[]
  ): YogaPractice[] {
    return [...existingPractices, ...newPractices];
  }

  static removeCustomPractices(practices: YogaPractice[]): YogaPractice[] {
    return practices.filter(p =>
      !p.id.startsWith('custom_') &&
      !p.id.startsWith('imported_') &&
      !p.id.startsWith('manual_')
    );
  }

  static removeCustomLearnedIds(learnedIds: string[]): string[] {
    return learnedIds.filter(id =>
      !id.startsWith('custom_') &&
      !id.startsWith('imported_') &&
      !id.startsWith('manual_')
    );
  }

  static toggleLearned(learnedIds: string[], practiceId: string): string[] {
    if (learnedIds.includes(practiceId)) {
      return learnedIds.filter(id => id !== practiceId);
    } else {
      return [...learnedIds, practiceId];
    }
  }

  static generateExampleCSV(): string {
    return `name,duration,order
Simha Kriya,25,6
Upa Yoga,30,7
Pranayama,20,8
Shambhavi Mahamudra,21,9
Jal Neti,10,10
Bhuta Shuddhi (Advanced),45,11
Trataka,15,12
Chandra Namaskara,35,13`;
  }
}
