// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LLMQueryTracker {
    // Struct to store LLM query information
    struct QueryData {
        string model;
        uint256 timestamp;
        string impact_score;
        address user_id;
        bool paid;
    }
    
    // Struct to store model information
    struct ModelInfo {
        bool exists;
        bool isBlocked;
        uint256 pendingPayments; // Count of unpaid queries for this model
    }
    
    // Array to store all queries
    QueryData[] public queries;
    
    // Mapping to track queries by user address
    mapping(address => uint256[]) public userQueries;
    
    // Mapping to get query by index
    mapping(uint256 => QueryData) public queryByIndex;
    
    // Mapping to track model information
    mapping(string => ModelInfo) public modelInfo;
    
    // Array to store unique model names
    string[] public uniqueModels;
    
    // Counter for query IDs
    uint256 public queryCounter;
    
    // Events
    event ContextExtracted(
        uint256 indexed queryId,
        string model,
        uint256 timestamp,
        string impact_score,
        address indexed user_id,
        bool paid
    );
    
    event PaymentStatusUpdated(
        uint256 indexed queryId,
        address indexed user_id,
        bool paid
    );
    
    event ModelBlocked(
        string indexed model,
        uint256 pendingPayments
    );
    
    event ModelUnblocked(
        string indexed model
    );
    
    // Modifiers
    modifier validQueryId(uint256 _queryId) {
        require(_queryId < queryCounter, "Invalid query ID");
        _;
    }
    
    modifier onlyQueryOwner(uint256 _queryId) {
        require(
            queryByIndex[_queryId].user_id == msg.sender,
            "Only query owner can perform this action"
        );
        _;
    }
    
    modifier modelNotBlocked(string memory _model) {
        require(
            !modelInfo[_model].isBlocked,
            "Model is currently blocked due to pending payments"
        );
        _;
    }
    
    /**
     * @dev Store a new LLM query with the provided parameters
     * @param _model The model name used for the query
     * @param _impact_score The impact score of the query
     * @param _user_id The address of the user making the query
     * @return queryId The ID of the newly created query
     */
    function storeQuery(
        string memory _model,
        string memory _impact_score,
        address _user_id
    ) public modelNotBlocked(_model) returns (uint256) {
        // Create new query with current timestamp and paid set to false
        QueryData memory newQuery = QueryData({
            model: _model,
            timestamp: block.timestamp,
            impact_score: _impact_score,
            user_id: _user_id,
            paid: false
        });
        
        // Store in array and mapping
        queries.push(newQuery);
        queryByIndex[queryCounter] = newQuery;
        userQueries[_user_id].push(queryCounter);
        
        // Handle model tracking
        if (!modelInfo[_model].exists) {
            // New model - add to unique models array
            uniqueModels.push(_model);
            modelInfo[_model].exists = true;
        }
        
        // Increment pending payments and block the model
        modelInfo[_model].pendingPayments++;
        modelInfo[_model].isBlocked = true;
        
        // Emit events
        emit ContextExtracted(
            queryCounter,
            _model,
            block.timestamp,
            _impact_score,
            _user_id,
            false
        );
        
        emit ModelBlocked(_model, modelInfo[_model].pendingPayments);
        
        // Increment counter and return query ID
        queryCounter++;
        return queryCounter - 1;
    }

    function unblockModel(string memory _model) public {
        require(
            modelInfo[_model].exists,
            "Model does not exist in the system"
        );
        require(
            modelInfo[_model].isBlocked,
            "Model is already unblocked"
        );
        
        modelInfo[_model].isBlocked = false;
        emit ModelUnblocked(_model);
    }
    
    /**
     * @dev Change the paid status of a query from false to true and unblock model if all payments are settled
     * @param _queryId The ID of the query to update
     */
    function markAsPaid(uint256 _queryId) 
        public 
        validQueryId(_queryId) 
        // onlyQueryOwner(_queryId) 
    {
        // require(
        //     !queryByIndex[_queryId].paid,
        //     "Query is already marked as paid"
        // );
        
        string memory model = queryByIndex[_queryId].model;
        
        // Update paid status
        queryByIndex[_queryId].paid = true;
        queries[_queryId].paid = true;
        
        // Decrement pending payments for the model
        modelInfo[model].pendingPayments--;
        
        // Unblock model if no pending payments remain
        if (modelInfo[model].pendingPayments == 0) {
            modelInfo[model].isBlocked = false;
            emit ModelUnblocked(model);
        }
        
        // Emit event
        emit PaymentStatusUpdated(
            _queryId,
            queryByIndex[_queryId].user_id,
            true
        );
    }
    
    /**
     * @dev Get query details by ID
     * @param _queryId The ID of the query
     * @return QueryData struct containing all query information
     */
    function getQuery(uint256 _queryId) 
        public 
        view 
        validQueryId(_queryId) 
        returns (QueryData memory) 
    {
        return queryByIndex[_queryId];
    }
    
    /**
     * @dev Get all query IDs for a specific user
     * @param _user The address of the user
     * @return Array of query IDs belonging to the user
     */
    function getUserQueries(address _user) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return userQueries[_user];
    }
    
    /**
     * @dev Get total number of queries stored
     * @return Total query count
     */
    function getTotalQueries() public view returns (uint256) {
        return queryCounter;
    }
    
    /**
     * @dev Get queries by payment status
     * @param _paid Payment status to filter by
     * @return Array of query IDs with the specified payment status
     */
    function getQueriesByPaymentStatus(bool _paid) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256[] memory result = new uint256[](queryCounter);
        uint256 resultCount = 0;
        
        for (uint256 i = 0; i < queryCounter; i++) {
            if (queryByIndex[i].paid == _paid) {
                result[resultCount] = i;
                resultCount++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory finalResult = new uint256[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            finalResult[i] = result[i];
        }
        
        return finalResult;
    }
    
    /**
     * @dev Batch store multiple queries (gas efficient for multiple entries)
     * @param _models Array of model names
     * @param _impact_scores Array of impact scores
     * @param _user_ids Array of user addresses
     * @return Array of query IDs for the newly created queries
     */
    function batchStoreQueries(
        string[] memory _models,
        string[] memory _impact_scores,
        address[] memory _user_ids
    ) public returns (uint256[] memory) {
        require(
            _models.length == _impact_scores.length && 
            _models.length == _user_ids.length,
            "Array lengths must match"
        );
        
        uint256[] memory queryIds = new uint256[](_models.length);
        
        for (uint256 i = 0; i < _models.length; i++) {
            queryIds[i] = storeQuery(_models[i], _impact_scores[i], _user_ids[i]);
        }
        
        return queryIds;
    }
    
    /**
     * @dev Get all unique models that have been used
     * @return Array of unique model names
     */
    function getUniqueModels() public view returns (string[] memory) {
        return uniqueModels;
    }
    
    /**
     * @dev Check if a model is currently blocked
     * @param _model The model name to check
     * @return True if the model is blocked, false otherwise
     */
    function isModelBlocked(string memory _model) public view returns (bool) {
        return modelInfo[_model].isBlocked;
    }
    
    /**
     * @dev Get pending payment count for a model
     * @param _model The model name to check
     * @return Number of unpaid queries for the model
     */
    function getModelPendingPayments(string memory _model) public view returns (uint256) {
        return modelInfo[_model].pendingPayments;
    }
    
    /**
     * @dev Get detailed information about a model
     * @param _model The model name to check
     * @return exists Whether the model exists in the system
     * @return isBlocked Whether the model is currently blocked
     * @return pendingPayments Number of unpaid queries for the model
     */
    function getModelInfo(string memory _model) 
        public 
        view 
        returns (bool exists, bool isBlocked, uint256 pendingPayments) 
    {
        ModelInfo memory info = modelInfo[_model];
        return (info.exists, info.isBlocked, info.pendingPayments);
    }
    
    /**
     * @dev Get all blocked models
     * @return Array of model names that are currently blocked
     */
    function getBlockedModels() public view returns (string[] memory) {
        uint256 blockedCount = 0;
        
        // First pass: count blocked models
        for (uint256 i = 0; i < uniqueModels.length; i++) {
            if (modelInfo[uniqueModels[i]].isBlocked) {
                blockedCount++;
            }
        }
        
        // Second pass: populate result array
        string[] memory blockedModels = new string[](blockedCount);
        uint256 resultIndex = 0;
        
        for (uint256 i = 0; i < uniqueModels.length; i++) {
            if (modelInfo[uniqueModels[i]].isBlocked) {
                blockedModels[resultIndex] = uniqueModels[i];
                resultIndex++;
            }
        }
        
        return blockedModels;
    }
}