import { default as request } from "axios";
import TokenProvider from "./TokenProvider";

export default class GraphQLProvider extends TokenProvider {
    constructor(key, contractSet, graphQLHost) {
        super(key, contractSet);

        this.graphQLHost = graphQLHost;
    }

    async queryGraphQL(query, variables, operationName) {
        const data = { query };

        if (variables) {
            data.variables = variables;
        }

        if (operationName) {
            data.operationName = operationName;
        }

        const response = await request(this.graphQLHost, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            data,
        });

        if (response.data.errors) {
            throw new Error(response.data.errors);
        }

        return response.data.data;
    }
}
