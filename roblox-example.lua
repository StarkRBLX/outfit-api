--[[
    Example usage of the Outfit Database SDK in Roblox
    
    This script demonstrates how to integrate the outfit database
    into your Roblox game for browsing and uploading outfits.
]]

local OutfitDB = require(script.Parent.OutfitDatabaseSDK)

-- Configure the SDK with your API endpoint and key
OutfitDB:Configure("https://your-domain.com", "your_api_key_here")

-- Example: Creating an outfit browser
local function createOutfitBrowser()
    -- Search for outfits
    local searchParams = {
        SortType = "Newest",
        Amount = 20,
        SearchKeyword = "Summer"
    }
    
    local outfits = OutfitDB:SearchOutfitsAsync(searchParams)
    
    if outfits then
        print("Found " .. #outfits .. " outfits:")
        for i, outfit in ipairs(outfits) do
            print(string.format("%d. %s - %d views, %d favourites", 
                i, outfit.name, outfit.views, outfit.favourites))
        end
    else
        warn("Failed to search outfits")
    end
end

-- Example: Getting specific outfit details
local function getOutfitDetails()
    local outfitIds = {
        [1] = 123456789,
        [2] = 987654321
    }
    
    local outfitDetails = OutfitDB:GetOutfitDetails(outfitIds)
    
    if outfitDetails then
        for key, outfit in pairs(outfitDetails) do
            if outfit then
                print("Outfit " .. key .. ": " .. outfit.name)
                print("Price: " .. outfit.price)
                print("Accessory Data: " .. game:GetService("HttpService"):JSONEncode(outfit.accessoryData))
            else
                print("Outfit " .. key .. " not found")
            end
        end
    else
        warn("Failed to get outfit details")
    end
end

-- Example: Uploading a new outfit
local function uploadOutfit(player)
    -- Example outfit data (you'd get this from your avatar system)
    local outfitData = {
        Name = player.Name .. "'s Summer Look",
        AccessoryData = game:GetService("HttpService"):JSONEncode({
            hat = 123456,
            shirt = 789012,
            pants = 345678,
            face = 901234
        }),
        Price = 50,
        SerializedDescription = {
            description = "A cool summer outfit",
            tags = {"summer", "casual", "trendy"}
        },
        OtherMetadata = {
            creator = player.Name,
            creatorId = player.UserId
        }
    }
    
    local outfitId = OutfitDB:UploadOutfit(outfitData)
    
    if outfitId then
        print("Outfit uploaded successfully! ID: " .. outfitId)
        return outfitId
    else
        warn("Failed to upload outfit")
        return nil
    end
end

-- Example: Incrementing outfit views when browsed
local function viewOutfit(outfitId)
    -- Increment view count
    local result = OutfitDB:IncrementViews({outfitId})
    
    if result and result.success then
        print("View count incremented for outfit " .. outfitId)
    end
end

-- Example: Favouriting an outfit
local function favouriteOutfit(outfitId)
    -- Increment favourite count
    local result = OutfitDB:IncrementFavourites({outfitId})
    
    if result and result.success then
        print("Favourite count incremented for outfit " .. outfitId)
    end
end

-- Example: Health check
local function checkAPIHealth()
    local isHealthy = OutfitDB:HealthCheck()
    
    if isHealthy then
        print("API is healthy and ready!")
    else
        warn("API is not responding correctly")
    end
end

-- Example game integration
local Players = game:GetService("Players")

-- When a player joins, check API health
Players.PlayerAdded:Connect(function(player)
    print(player.Name .. " joined the game!")
    
    -- Check if API is working
    spawn(function()
        checkAPIHealth()
    end)
end)

-- Example GUI integration functions
local function createBrowseButton(parent, player)
    local button = Instance.new("TextButton")
    button.Size = UDim2.new(0, 200, 0, 50)
    button.Text = "Browse Outfits"
    button.Parent = parent
    
    button.MouseButton1Click:Connect(function()
        spawn(function()
            createOutfitBrowser()
        end)
    end)
end

local function createUploadButton(parent, player)
    local button = Instance.new("TextButton")
    button.Size = UDim2.new(0, 200, 0, 50)
    button.Position = UDim2.new(0, 0, 0, 60)
    button.Text = "Upload Current Outfit"
    button.Parent = parent
    
    button.MouseButton1Click:Connect(function()
        spawn(function()
            uploadOutfit(player)
        end)
    end)
end

-- Create GUI for each player
Players.PlayerAdded:Connect(function(player)
    player.CharacterAdded:Connect(function(character)
        local playerGui = player:WaitForChild("PlayerGui")
        
        local screenGui = Instance.new("ScreenGui")
        screenGui.Name = "OutfitBrowser"
        screenGui.Parent = playerGui
        
        local frame = Instance.new("Frame")
        frame.Size = UDim2.new(0, 250, 0, 150)
        frame.Position = UDim2.new(1, -270, 0, 20)
        frame.BackgroundColor3 = Color3.new(0, 0, 0)
        frame.BackgroundTransparency = 0.3
        frame.Parent = screenGui
        
        createBrowseButton(frame, player)
        createUploadButton(frame, player)
    end)
end)

return {
    createOutfitBrowser = createOutfitBrowser,
    getOutfitDetails = getOutfitDetails,
    uploadOutfit = uploadOutfit,
    viewOutfit = viewOutfit,
    favouriteOutfit = favouriteOutfit,
    checkAPIHealth = checkAPIHealth
} 