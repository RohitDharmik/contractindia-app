import { mockServices, mockCompanies, mockReviews } from '@/services/mockData';
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
export const servicesApi = {
    async list(filters) {
        await delay();
        return mockServices.filter((s) => {
            if (filters?.category && s.category !== filters.category)
                return false;
            if (filters?.city && s.city.toLowerCase() !== filters.city.toLowerCase())
                return false;
            if (filters?.query) {
                const q = filters.query.toLowerCase();
                if (!s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q))
                    return false;
            }
            return true;
        });
    },
    async get(id) {
        await delay();
        return mockServices.find((s) => s.id === id);
    },
    async reviews(_id) {
        await delay();
        return mockReviews;
    },
};
export const companiesApi = {
    async get(id) {
        await delay();
        return mockCompanies.find((c) => c.id === id);
    },
    async list() {
        await delay();
        return mockCompanies;
    },
};
