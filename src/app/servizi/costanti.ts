export const ADDRESS_BACKEND = "http://localhost:8081";
export const ADDRESS_AUTHENTICATION_SERVER = "http://localhost:9090";

// authentication
export const REALM = "LaTanaDelNerd";
export const CLIENT_ID = "ftend";
export const REQUEST_LOGIN = "/realms/" + REALM + "/protocol/openid-connect/token";
export const REQUEST_LOGOUT = "/realms/" + REALM + "/protocol/openid-connect/logout";

// requests
export const REQUEST_SEARCH_PRODUCTS = "/products/search/by_name";
export const REQUEST_ADD_USER = "/users";
