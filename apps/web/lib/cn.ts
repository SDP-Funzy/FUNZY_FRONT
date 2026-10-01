type ClassValue = string | false | null | undefined;

/** 조건부 className 합치기. 같은 속성끼리 충돌 정리까지 필요해지면 tailwind-merge 도입 고려 */
export const cn = (...classes: ClassValue[]) => classes.filter(Boolean).join(' ');
