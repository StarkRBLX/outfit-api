--[[
    Outfit Database SDK for Roblox
    
    Usage:
    local OutfitDB = require(path.to.OutfitDatabaseSDK)
    OutfitDB:Configure("your-api-endpoint", "your-api-key")
    
    local outfits = OutfitDB:GetOutfitDetails({[1] = 123456, [2] = 789012})
    local searchResults = OutfitDB:SearchOutfitsAsync({SortType = "Newest", Amount = 50, SearchKeyword = "Summer"})
]]

local HttpService = game:GetService("HttpService")

local OutfitDatabaseSDK = {}
OutfitDatabaseSDK.__index = OutfitDatabaseSDK

-- Configuration
local API_ENDPOINT = ""
local API_KEY = ""

function OutfitDatabaseSDK:Configure(endpoint, apiKey)
    API_ENDPOINT = endpoint
    API_KEY = apiKey
end

-- Private function to make HTTP requests
local function makeRequest(endpoint, data)
    if API_ENDPOINT == "" or API_KEY == "" then
        error("SDK not configured. Call Configure() first.")
    end
    
    local url = API_ENDPOINT .. endpoint
    local headers = {
        ["Content-Type"] = "application/json",
        ["X-API-Key"] = API_KEY
    }
    
    local success, response = pcall(function()
        return HttpService:PostAsync(url, HttpService:JSONEncode(data), Enum.HttpContentType.ApplicationJson, false, headers)
    end)
    
    if not success then
        warn("HTTP Request failed: " .. tostring(response))
        return nil
    end
    
    local decodedResponse
    success, decodedResponse = pcall(function()
        return HttpService:JSONDecode(response)
    end)
    
    if not success then
        warn("Failed to decode JSON response: " .. tostring(decodedResponse))
        return nil
    end
    
    return decodedResponse
end

-- GetOutfitDetails API
-- Takes dictionary of outfit unique IDs, returns outfit data for each
-- Example: {[1] = 823112, [2] = 3428323} -> {[1] = outfitData, [2] = outfitData}
function OutfitDatabaseSDK:GetOutfitDetails(outfitUniqueIds)
    if type(outfitUniqueIds) ~= "table" then
        error("outfitUniqueIds must be a table/dictionary")
    end
    
    local requestData = {
        OutfitUniqueIds = outfitUniqueIds
    }
    
    return makeRequest("/api/GetOutfitDetails", requestData)
end

-- SearchOutfitsAsync API
-- Searches for outfits based on parameters
-- Returns array of outfit metadata
function OutfitDatabaseSDK:SearchOutfitsAsync(searchParams)
    searchParams = searchParams or {}
    
    -- Set defaults
    local requestData = {
        SortType = searchParams.SortType or "Newest",
        Amount = searchParams.Amount or 50,
        SearchKeyword = searchParams.SearchKeyword or ""
    }
    
    -- Validate Amount
    if requestData.Amount > 200 then
        requestData.Amount = 200
    elseif requestData.Amount < 1 then
        requestData.Amount = 1
    end
    
    return makeRequest("/api/SearchOutfitsAsync", requestData)
end

-- UploadOutfit API
-- Uploads a new outfit to the database
-- Returns unique outfit ID
function OutfitDatabaseSDK:UploadOutfit(outfitInfo)
    if type(outfitInfo) ~= "table" then
        error("outfitInfo must be a table")
    end
    
    if not outfitInfo.Name or not outfitInfo.AccessoryData then
        error("outfitInfo must contain Name and AccessoryData fields")
    end
    
    local requestData = {
        Name = outfitInfo.Name,
        AccessoryData = outfitInfo.AccessoryData,
        Price = outfitInfo.Price or 0,
        SerializedDescription = outfitInfo.SerializedDescription or {},
        OtherMetadata = outfitInfo.OtherMetadata or {}
    }
    
    return makeRequest("/api/UploadOutfit", requestData)
end

-- IncrementViews API
-- Increments view count for multiple outfits
function OutfitDatabaseSDK:IncrementViews(outfitIds)
    if type(outfitIds) ~= "table" then
        error("outfitIds must be an array")
    end
    
    return makeRequest("/api/IncrementViews", outfitIds)
end

-- IncrementFavourites API  
-- Increments favourite count for multiple outfits
function OutfitDatabaseSDK:IncrementFavourites(outfitIds)
    if type(outfitIds) ~= "table" then
        error("outfitIds must be an array")
    end
    
    return makeRequest("/api/IncrementFavourites", outfitIds)
end

-- Health check
function OutfitDatabaseSDK:HealthCheck()
    if API_ENDPOINT == "" then
        error("SDK not configured. Call Configure() first.")
    end
    
    local url = API_ENDPOINT .. "/health"
    
    local success, response = pcall(function()
        return HttpService:GetAsync(url)
    end)
    
    if not success then
        warn("Health check failed: " .. tostring(response))
        return false
    end
    
    local decodedResponse
    success, decodedResponse = pcall(function()
        return HttpService:JSONDecode(response)
    end)
    
    return success and decodedResponse and decodedResponse.status == "OK"
end

return OutfitDatabaseSDK 