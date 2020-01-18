const {
    graphql,
    GraphQLObjectType,
    GraphQLSchema,
    GraphQLNonNull,
    GraphQLScalarType,
    Kind,
    GraphQLError,
    print
} = require("graphql");

/*
This is an example custom scalar implementation for 
the blog post https://www.graphql.de/blog/scalars-in-depth/

NOT PRODUCTION READY CODE!
*/

class Money {
    constructor(euro, cents) {
        this.euro = euro;
        this.cents = cents;
    }

    toString() {
        return this.euro + "." + this.cents;
    }
}

const parseMoneyString = (string) => {
    const ix = string.indexOf('.');
    if (ix == -1) {
        return new Money(parseInt(string), 0);
    }
    const euro = parseInt(string.substring(0, ix));
    const cents = parseInt(string.substring(ix + 1, string.length));
    return new Money(euro, cents);
};

const parseCentsNumber = (allCents) => {
    const euro = Math.floor(allCents / 100);
    const leftCent = allCents - euro * 100;
    return new Money(euro, leftCent);
};

const moneyScalar = new GraphQLScalarType({
    name: 'Money',
    description: 'Representing money in EUR',
    // result coercion
    // return formatted Money string
    serialize(value) {
        if (typeof value === 'string') {
            const money = parseMoneyString(value);
            return money.toString();
        }
        if (typeof value === 'number') {
            const money = parseCentsNumber(value);
            return money.toString();
        }
        if (value instanceof Money) {
            return value.toString();
        }
        throw new GraphQLError(
            `Invalid value from resolver for Money ${value}`,
        );
    },
    // value input coercion
    // returns Money object
    parseValue(value) {
        if (typeof value === 'string') {
            const money = parseMoneyString(value);
            return money;
        }
        if (typeof value === 'number') {
            const money = parseCentsNumber(value);
            return money;
        }
        if (value instanceof Money) {
            return value;
        }
        throw new GraphQLError(
            `Invalid input value for Money ${value}`,
        );
    },
    // literal input coercion
    // returns Money object
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return parseMoneyString(ast.value);
        }
        if (ast.kind == Kind.INT) {
            const cents = parseInt(ast.value);
            return parseCentsNumber(cents);
        }
        throw new GraphQLError(
            `Invalid literal for money ${print(ast)}`,
        );
    }
});

const echoResolver = (root, { money }) => {
    console.log('money', money);
    return money;
};
const queryType = new GraphQLObjectType({
    name: "Query",
    fields: {
        echo: {
            type: moneyScalar,
            args: { money: { type: new GraphQLNonNull(moneyScalar) } },
            resolve: echoResolver,
        },
    }
});

const schema = new GraphQLSchema({
    query: queryType,
});

const executeQuery = (query) => {
    graphql(schema, query).then(result => {
        console.log(JSON.stringify(result));
    });
};

executeQuery('{ echo(money: "49.99") }');
executeQuery('{ echo(money: 4999) }');
