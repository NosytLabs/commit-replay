export type Profile = {
    login: string;
    name: string;
    avatar: string;
    url: string;
    createdAt: string;
    followers: number;
    publicRepos: number;
};
export type Repo = {
    id: number;
    name: string;
    fullName: string;
    url: string;
    private: boolean;
    fork: boolean;
    stars: number;
    language: string | null;
    branch: string;
    status: 'pending' | 'scanning' | 'complete' | 'error';
    page: number;
    error?: string;
};
export type Commit = {
    sha: string;
    date: string;
    repoId: number;
    merge: boolean;
};
export type Snapshot = {
    version: 1;
    profile: Profile;
    repos: Repo[];
    commits: Commit[];
    fetchedAt: string;
    demo: boolean;
    repoListComplete: boolean;
    message?: string;
    retryAt?: string;
    requests: number;
};
export type Options = {
    timezone: string;
    year: string;
    repoIds?: number[];
    includePrivate: boolean;
    now?: string;
};
export type Day = {
    date: string;
    count: number;
    repos: Record<number, number>;
};
export type RecapStats = {
    total: number;
    activeDays: number;
    first: string | null;
    last: string | null;
    days: Day[];
    months: {
        date: string;
        count: number;
    }[];
    peak: Day | null;
    streak: {
        count: number;
        start: string | null;
        end: string | null;
    };
    currentStreak: number;
    weekdays: number[];
    hours: number[];
    repos: (Repo & {
        commits: number;
    })[];
    languages: {
        name: string;
        count: number;
        percent: number;
    }[];
    coverage: {
        total: number;
        complete: number;
        errors: number;
        partial: boolean;
    };
    stars: number;
    start: string;
    end: string;
    timezone: string;
    year: string;
    demo: boolean;
};
