const { ethers } = require("hardhat");
const Product = require("../product.json");
const { assert, expect } = require("chai");

describe("MyAuction", function () {
    let MyAuction; // contract factory
    let auction; // contract object
    let owner; // contract owner address
    let bidders; // bidding participants
    let sampleBidAmounts = [1, 1.2, 1.5, 1.9 , 2.1]; // ตัวอย่างการประมูล | หน่วยเป็น ether
    // .parseEther แปลงหน่วยจาก ether to wei
    const sampleBidAmounttswei = sampleBidAmounts.map(amoumt => ethers.parseEther(amoumt.toString()));

    // before ใช้สำหรับ setup สิ่งที่จำเป็นทั้งหมดก่อนการเทส | before จะถูกเรียกก่อนทุกครั้งที่ฟังก์ชันทำงาน
    this.beforeEach(async () => {
        console.log("before each ...")
        MyAuction = await ethers.getContractFactory("MyAuction"); // contract factory | contract factory คือ class ที่ใช้สำหรับสร้าง contract object
        // ประมูลนี้จะจบได้เมื่อผ่านไป 5
        auction = await MyAuction.deploy(Product.Brand, Product.SerialNumber, 5); // parametor อิงจาก constucttor ว่ามีอะไรบ้าง
        // await auction.deployed(); // บรรทัดสั่งให้ทำงาน
        [owner, ...bidders] = await ethers.getSigners(); // getSigners เอา address ของผู้ที่ลงชื่อด้วย private key | ค่าตำแหน่งที่ 0 จาก ganache จะเป็นของ owner และ ที่เหลือจะเป็นของ bidders
    });


    // getProductInfo() 
    it("should return the information of the product" , async () => {
        const [returnBrand , returnSerialNumber] = await auction.getProductInfo(); // [brand , serial] เรียกว่า deconstruction คือแยกเป็นตัวแปรย่อย
        expect(returnBrand).to.equal(Product.Brand); // ค่าที่ return มาจาก contract จะต้องเท่ากับที่เราส่งไป
        expect(returnSerialNumber).to.equal(Product.SerialNumber); // ค่าที่ return มาจาก contract จะต้องเท่ากับที่เราส่งไป
    });
 
    // bid() 
    it("should make a bid" , async () => {
        for (let i = 0; i < sampleBidAmounttswei.length; i++){
            const ct = await auction.connect(bidders[i]); // เชื่อมต่อกับ address 
            const tx  = await ct.bid({value: sampleBidAmounttswei[i]}); // คนที่ 1 จะส่งค่านี้ | ฟังก์ชั่น รับอะไรก็ได้จะส่งไปตามจำนวน parametor
            const receipt = await tx.wait(); // waits for mining comfirmation

            expect(receipt.status).to.equal(1); // ถ้า receipt สำเร็จ receipt จะให้ statsu เป็น 1 หมายถึงอยู่บน contract เรียบร้อยแล้ว
            const hBidAmount = await ct.highestBid(); // เรียกดูการประมูลสูงสุด
            expect(hBidAmount).to.equal(sampleBidAmounttswei[i]); // ค่าการประมูลสูงสุดจะต้องเท่ากับที่เราส่งไป
            
            const bidAmount = await auction.getMyBid(bidders[i]); // เรียกดูการประมูลของ bidder คนนี้
            expect(bidAmount).to.equal(sampleBidAmounttswei[i]); // ค่าการประมูลของ bidder คนนี้จะต้องเท่ากับที่เราส่งไป
        }
    });

    // // getHighestBid(); 
    // it("should return the current highest's bidding amount" , async () => {
    //     assert.fail();
    // });

    // // getMyBid(address bidder) ;
    // it("should return the my bidding amount" , async () => {
    //     assert.fail();
    // });

    const delay = sec => new Promise(resolve => setTimeout(resolve, sec * 1000)); // delay for "sec" seconds | Promise = Async | setTimeout คือมิลลิเซค เราเลย * 1000 เพื่อให้เป็นวินาทีได้
    const AS = {'STARTED':0, 'ENDED': 1, 'CANCELLED': 2}; // สถานะการประมูล | 0 = STARTED , 1 = ENDED , 2 = CANCELLED
    // endAuction() ;
    it("should end the auction" , async () => {
        for (let i = 0; i < sampleBidAmounttswei.length; i++){
            const ct = await auction.connect(bidders[i]); // เชื่อมต่อกับ address 
            const tx  = await ct.bid({value: sampleBidAmounttswei[i]}); // คนที่ 1 จะส่งค่านี้ | ฟังก์ชั่น รับอะไรก็ได้จะส่งไปตามจำนวน parametor
            const receipt = await tx.wait(); // waits for mining comfirmation
        }
        await delay(5); // delay for 5 seconds
        const ct = await auction.connect(owner); // เชื่อมต่อกับ address ของ owner
        const state1 = await ct.STATE(); // เรียกดูสถานะการประมูล
        expect(state1).to.equal(AS.STARTED); // ค่าตำแหน่งที่ 0 คือ STARTED
        const tx = await ct.endAuction(); // เรียกใช้ฟังก์ชั่น endAuction
        await tx.wait(); // waits for mining comfirmation
        const state2 = await ct.STATE(); // เรียกดูสถานะการประมูลอีกครั้ง
        expect(state2).to.equal(AS.ENDED); // ค่าตำแหน่งที่ 1 คือ ENDED
    });


    // cancelAuction()
    it("should cancel the auction" , async () => {
        const ct = await auction.connect(owner); // เชื่อมต่อกับ address ของ owner
        const state1 = await ct.STATE(); // เรียกดูสถานะการประมูล
        expect(state1).to.equal(AS.STARTED); // ค่าตำแหน่งที่ 0 คือ STARTED
        const tx = await ct.cancelAuction(); // เรียกใช้ฟังก์ชั่น cancelAuction
        await tx.wait(); // waits for mining comfirmation
        const state2 = await ct.STATE(); // เรียกดูสถานะการประมูลอีกครั้ง
        expect(state2).to.equal(AS.CANCELLED); // ค่าตำแหน่งที่ 2 คือ CANCELLED
    });
    
    // withdraw() - ถอนตอนที่ประมูลจบ
    it("should make a withdraw after auction has ended" , async () => {
        for (let i = 0; i < sampleBidAmounttswei.length; i++){ // วนลูปตามจำนวน bidder ที่เข้ามาประมูล
            const ct = await auction.connect(bidders[i]); // เชื่อมต่อกับ address 
            const tx  = await ct.bid({value: sampleBidAmounttswei[i]}); // คนที่ 1 จะส่งค่านี้ | ฟังก์ชั่น รับอะไรก็ได้จะส่งไปตามจำนวน parametor
            const receipt = await tx.wait(); // waits for mining comfirmation
        }
        await delay(5); // delay for 5 seconds
        const ct = auction.connect(owner); // เชื่อมต่อกับ address ของ owner
        const state1 = await ct.STATE(); // เรียกดูสถานะการประมูล
        expect(state1).to.equal(AS.STARTED); // ค่าตำแหน่งที่ 0 คือ STARTED
        const tx = await ct.endAuction(); // เรียกใช้ฟังก์ชั่น endAuction
        await tx.wait(); // waits for mining comfirmation
        
        const highestBidder = await ct.highestBidder(); // ดูว่าใครคือผู้ชนะการประมูล
        for ( let i = 0; i < sampleBidAmounttswei.length; i++){ // วนลูปตามจำนวน bidder ที่เข้ามาประมูล
            if(bidders[i].address != highestBidder){ // ถ้า address ของ bidder คนนี้ไม่ใช่ highestBidder
                const ct = await auction.connect(bidders[i]); // เชื่อมต่อกับ address ของ bidder คนนี้
                // คาดหวังว่าเมื่อเรียกใช้ฟังก์ชั่น withdraw จะทำให้ยอดเงินใน address ของ bidder คนนี้เพิ่มขึ้นตามจำนวนที่เคยประมูลไป
                expect( ct.withdraw()).to.changeEtherBalance(bidders[i] , sampleBidAmounttswei[i]); 
            } else { // ถ้า address ของ bidder คนนี้คือ highestBidder
                const ct = await auction.connect(bidders[i]); // เชื่อมต่อกับ address ของ bidder คนนี้
                // คาดหวังว่าเมื่อเรียกใช้ฟังก์ชั่น withdraw จะต้องล้มเหลว และแสดงข้อความนี้
                await expect( ct.withdraw()).to.be.revertedWith("You not make a withdraw"); 
            }
        }
    });

    
    // withdraw() - cancelled auction
    it("should make a withdraw after auction has cancelled" , async () => {
        // ทำการประมูลก่อน 
        for (let i = 0; i < sampleBidAmounttswei.length; i++){
            const ct = await auction.connect(bidders[i]); // เชื่อมต่อกับ address 
            const tx  = await ct.bid({value: sampleBidAmounttswei[i]}); // bidder แต่ละคนทำการประมูล
            const receipt = await tx.wait(); // waits for mining comfirmation
        }

        // เจ้าของทำการยกเลิกการประมูล
        await delay(5); // delay for 5 seconds
        const ct = auction.connect(owner); // เชื่อมต่อกับ address ของ owner
        const state1 = await ct.STATE(); // เรียกดูสถานะการประมูล
        expect(state1).to.equal(AS.STARTED); // ค่าตำแหน่งที่ 0 คือ STARTED
        const tx = await ct.cancelAuction(); // เรียกใช้ฟังก์ชั่น cancelAuction
        await tx.wait(); // waits for mining comfirmation

        await expect(ct.withdraw()).to.be.revertedWith("Owner can not make a withdraw"); // คาดหวังว่าเจ้าของจะไม่สามารถถอนเงินได้

        // ทำการถอนเงินทั้งหมดคืนให้ bidder ทุกคน 
        for ( let i = 0; i < sampleBidAmounttswei.length; i++){
            const ct = await auction.connect(bidders[i]); // เชื่อมต่อกับ address ของ bidder คนนี้
            // คาดหวังว่าเมื่อเรียกใช้ฟังก์ชั่น withdraw จะทำให้ยอดเงินใน address ของ bidder คนนี้เพิ่มขึ้นตามจำนวนที่เคยประมูลไป
            expect( ct.withdraw()).to.changeEtherBalance(bidders[i] , sampleBidAmounttswei[i]);
        }
    });

});