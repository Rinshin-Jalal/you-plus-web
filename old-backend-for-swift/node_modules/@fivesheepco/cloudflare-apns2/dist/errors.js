export var Errors;
(function (Errors) {
    Errors["badCertificate"] = "BadCertificate";
    Errors["badCertificateEnvironment"] = "BadCertificateEnvironment";
    Errors["badCollapseId"] = "BadCollapseId";
    Errors["badDeviceToken"] = "BadDeviceToken";
    Errors["badExpirationDate"] = "BadExpirationDate";
    Errors["badMessageId"] = "BadMessageId";
    Errors["badPath"] = "BadPath";
    Errors["badPriority"] = "BadPriority";
    Errors["badTopic"] = "BadTopic";
    Errors["deviceTokenNotForTopic"] = "DeviceTokenNotForTopic";
    Errors["duplicateHeaders"] = "DuplicateHeaders";
    Errors["error"] = "Error";
    Errors["expiredProviderToken"] = "ExpiredProviderToken";
    Errors["forbidden"] = "Forbidden";
    Errors["idleTimeout"] = "IdleTimeout";
    Errors["internalServerError"] = "InternalServerError";
    Errors["invalidProviderToken"] = "InvalidProviderToken";
    Errors["invalidPushType"] = "InvalidPushType";
    Errors["invalidSigningKey"] = "InvalidSigningKey";
    Errors["methodNotAllowed"] = "MethodNotAllowed";
    Errors["missingDeviceToken"] = "MissingDeviceToken";
    Errors["missingProviderToken"] = "MissingProviderToken";
    Errors["missingTopic"] = "MissingTopic";
    Errors["payloadEmpty"] = "PayloadEmpty";
    Errors["payloadTooLarge"] = "PayloadTooLarge";
    Errors["serviceUnavailable"] = "ServiceUnavailable";
    Errors["shutdown"] = "Shutdown";
    Errors["tooManyProviderTokenUpdates"] = "TooManyProviderTokenUpdates";
    Errors["tooManyRequests"] = "TooManyRequests";
    Errors["topicDisallowed"] = "TopicDisallowed";
    Errors["unknownError"] = "UnknownError";
    Errors["unregistered"] = "Unregistered";
})(Errors || (Errors = {}));
export class ApnsError extends Error {
    statusCode;
    notification;
    response;
    constructor(props) {
        super(`APNS Error: ${props.statusCode} - ${props.response.reason}`);
        this.statusCode = props.statusCode;
        this.notification = props.notification;
        this.response = props.response;
    }
    get reason() {
        return this.response.reason;
    }
    get timestamp() {
        return this.response.timestamp;
    }
}
