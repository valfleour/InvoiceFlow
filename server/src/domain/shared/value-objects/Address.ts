export class Address {
    constructor(
        public readonly street: string,
        public readonly city: string,
        public readonly state: string,
        public readonly postalCode: string,
        public readonly country: string
    ) { }

    static create(props: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    }): Address {
        const street = props.street.trim();
        const city = props.city.trim();
        const state = props.state.trim();
        const postalCode = props.postalCode.trim();
        const country = props.country.trim();

        if (!street || !city || !state || !postalCode || !country) {
            throw new Error('Address must include street, city, state, postal code, and country');
        }

        return new Address(
            street,
            city,
            state,
            postalCode,
            country
        );
    }

    toPlain() {
        return {
            street: this.street,
            city: this.city,
            state: this.state,
            postalCode: this.postalCode,
            country: this.country,
        };
    }
}
